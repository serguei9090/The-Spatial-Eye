"use client";

import { GoogleGenAI, type LiveServerMessage, Modality, type Tool } from "@google/genai";
import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_GEMINI_LIVE_MODEL } from "@/lib/api/gemini_websocket";
import { useAuth } from "@/lib/auth/auth-context";
import { notifyModelError } from "@/lib/gemini/model-error";
import { decode, decodeAudioData } from "@/lib/utils/audio";
import { toast } from "sonner";

type LiveSession = Awaited<ReturnType<GoogleGenAI["live"]["connect"]>>;

export interface UseGeminiCoreProps {
  systemInstruction: string;
  tools?: Tool[];
  onToolCall?: (toolCall: LiveServerMessage["toolCall"]) => void;
  onTranscript?: (text: string) => void;
  resumePrompt?: string;
}

export function useGeminiCore({
  systemInstruction,
  tools,
  onToolCall,
  onTranscript,
  resumePrompt = "The connection to the server was briefly interrupted. Please resume what you were doing exactly where you left off.",
}: UseGeminiCoreProps) {
  const sessionRef = useRef<LiveSession | null>(null);
  const manualCloseRef = useRef(false);
  const isConnectedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<{ source: AudioBufferSourceNode; gain: GainNode }>>(
    new Set(),
  );
  const nextStartTimeRef = useRef<number>(0);
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reconnection refs
  const reconnectAttemptRef = useRef(0);
  const connectRef = useRef<((isAutoReconnect?: boolean) => Promise<boolean>) | null>(null);

  const { user } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [modelAvailability, setModelAvailability] = useState<
    "unknown" | "checking" | "available" | "unavailable"
  >("unknown");

  // ---------------------------------------------------------------------------
  // Check Model Availability
  // ---------------------------------------------------------------------------
  const checkModelAvailability = useCallback(async (): Promise<boolean> => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!key?.startsWith("AIza")) {
      setModelAvailability("unavailable");
      notifyModelError(DEFAULT_GEMINI_LIVE_MODEL, new Error("Invalid or missing API key."));
      return false;
    }
    setModelAvailability("checking");
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${DEFAULT_GEMINI_LIVE_MODEL}?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status === 429) {
        setModelAvailability("available");
        return true;
      }
      // 403 = billing disabled / access denied, anything else = unexpected
      const reason =
        response.status === 403
          ? "Access denied — billing may be disabled for this model."
          : `Server returned ${response.status}.`;
      setModelAvailability("unavailable");
      notifyModelError(DEFAULT_GEMINI_LIVE_MODEL, new Error(reason));
      return false;
    } catch {
      // Network error — be optimistic, don't block the user
      setModelAvailability("available");
      return true;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Audio Playback & Control
  // ---------------------------------------------------------------------------
  const stopAudio = useCallback((fadeOutDuration = 0) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === "closed") {
      activeSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      return;
    }

    for (const { source, gain } of activeSourcesRef.current) {
      try {
        if (fadeOutDuration > 0) {
          const currentTime = ctx.currentTime;
          gain.gain.cancelScheduledValues(currentTime);
          gain.gain.setValueAtTime(gain.gain.value, currentTime);
          gain.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
          source.stop(currentTime + fadeOutDuration);
        } else {
          source.stop();
        }
      } catch {
        // ignore
      }
    }

    if (fadeOutDuration === 0) {
      activeSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    } else {
      nextStartTimeRef.current = 0;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    console.log("[GeminiCore] Disconnecting...");
    manualCloseRef.current = true;
    isConnectedRef.current = false;
    if (keepAliveIntervalRef.current !== null) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    try {
      sessionRef.current?.close();
    } catch {
      // ignore
    }
    sessionRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    stopAudio(0);
    if (audioContextRef.current?.state !== "closed") {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    }
  }, [stopAudio]);

  const connect = useCallback(
    async (isAutoReconnect = false): Promise<boolean> => {
      console.log("[GeminiCore] Connect called.");

      if (!isAutoReconnect) {
        reconnectAttemptRef.current = 0;
      }
      manualCloseRef.current = false;

      if (!user) {
        const msg = "Sign in required before connecting.";
        setError(msg);
        setErrorCode("AUTH_REQUIRED");
        setErrorMessage(msg);
        return false;
      }
      if (sessionRef.current) {
        setIsConnected(true);
        return true;
      }

      setIsConnecting(true);
      setError(null);
      setErrorCode(undefined);
      setErrorMessage(undefined);

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        const msg = "Missing API Key";
        setError(msg);
        setIsConnecting(false);
        return false;
      }

      // Init Audio Context
      // Initialize at the hardware's native sample rate to avoid driver conflicts
      // on non-standard hardware (e.g., Hackintosh with AppleALC/Lilu). The SDK's
      // audio pipeline handles resampling from Gemini's 24kHz output internally.
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const probeCtx = new AudioContextClass();
        // Reuse if already 24kHz, otherwise recreate to avoid mismatched context
        audioContextRef.current =
          probeCtx.sampleRate === 24000
            ? probeCtx
            : (() => {
                void probeCtx.close();
                return new AudioContextClass({ sampleRate: probeCtx.sampleRate });
              })();
      }

      return new Promise((resolve) => {
        const ai = new GoogleGenAI({ apiKey });
        ai.live
          .connect({
            model: DEFAULT_GEMINI_LIVE_MODEL,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
              },
              outputAudioTranscription: {}, // To receive text
              systemInstruction: systemInstruction,
              tools: tools || [],
            },
            callbacks: {
              onopen: () => {
                console.log("[GeminiCore] Session opened.");
                setIsConnecting(false);
                setIsConnected(true);
                isConnectedRef.current = true;
                resolve(true); // Resolves the `.then((session) => ...)`

                if (reconnectAttemptRef.current > 0) {
                  // Give the session ref a tiny moment to attach from the `.then()` Block
                  setTimeout(() => {
                    try {
                      const activeSession = sessionRef.current;
                      if (activeSession) {
                        console.log("[GeminiCore] Sending auto-resume context...");
                        activeSession.sendClientContent({
                          turns: [
                            {
                              role: "user",
                              parts: [
                                {
                                  text: resumePrompt,
                                },
                              ],
                            },
                          ],
                          turnComplete: true,
                        });
                      }
                    } catch (e) {
                      console.error("[GeminiCore] Failed to send resume context:", e);
                    }
                  }, 500);
                }

                reconnectAttemptRef.current = 0; // Reset on successful open

                // Heartbeat: send a silent keep-alive every 25 seconds to prevent
                // NAT/firewall and Hackintosh power-management-induced 1006 drops.
                if (keepAliveIntervalRef.current !== null) {
                  clearInterval(keepAliveIntervalRef.current);
                }
                keepAliveIntervalRef.current = setInterval(() => {
                  if (sessionRef.current && isConnectedRef.current) {
                    try {
                      sessionRef.current.sendClientContent({
                        turns: [{ role: "user", parts: [{ text: " " }] }],
                        turnComplete: false,
                      });
                      console.log("[GeminiCore] Heartbeat sent.");
                    } catch {
                      // Ignore — if the session is dead the onclose handler will manage it
                    }
                  }
                }, 25_000);
              },
              onmessage: async (msg: LiveServerMessage) => {
                // 1. Interruption
                if (msg.serverContent?.interrupted) {
                  console.log("[GeminiCore] Interrupted.");
                  stopAudio(0); // Immediate stop
                  return;
                }

                // 2. Audio Playback
                const parts = msg.serverContent?.modelTurn?.parts ?? [];
                for (const part of parts) {
                  if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/")) {
                    try {
                      const ctx = audioContextRef.current;
                      if (!ctx) continue;
                      if (ctx.state === "suspended") await ctx.resume();

                      const audioBuffer = await decodeAudioData(
                        decode(part.inlineData.data),
                        ctx,
                        24000,
                      );

                      const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
                      const source = ctx.createBufferSource();
                      const gain = ctx.createGain();

                      source.buffer = audioBuffer;
                      source.connect(gain);
                      gain.connect(ctx.destination);

                      const unit = { source, gain };
                      source.onended = () => {
                        activeSourcesRef.current.delete(unit);
                      };

                      source.start(startTime);
                      nextStartTimeRef.current = startTime + audioBuffer.duration;
                      activeSourcesRef.current.add(unit);
                    } catch (e) {
                      console.error("[GeminiCore] Audio error:", e);
                    }
                  }
                }

                // 3. Tool Calls -> Propagate to consumer
                if (msg.toolCall && onToolCall) {
                  // Notify the consumer first so UI state mutations begin.
                  onToolCall(msg.toolCall);

                  // Build the response payload before yielding.
                  const calls = msg.toolCall.functionCalls || [];
                  const responses = calls.map((fc) => ({
                    id: fc.id,
                    name: fc.name,
                    // Return meaningful state rather than a static { success: true }.
                    // This prevents the model from looping or crashing the session when
                    // it expects actionable context back from the tool.
                    response: { output: { status: "updated", timestamp: Date.now() } },
                  }));

                  // Use queueMicrotask to yield to React's state batching before sending
                  // the tool response. This prevents a race condition in the WebSocket
                  // buffer when the model is simultaneously streaming audio and a tool call.
                  queueMicrotask(() => {
                    try {
                      sessionRef.current?.sendToolResponse({ functionResponses: responses });
                      console.log(
                        "[GeminiCore] Sent sendToolResponse for:",
                        responses.map((r) => r.name).join(", "),
                      );
                    } catch (e) {
                      console.error("[GeminiCore] Failed to sendToolResponse:", e);
                    }
                  });
                }

                // 4. Transcript -> Propagate to consumer
                if (msg.serverContent?.outputTranscription?.text && onTranscript) {
                  onTranscript(msg.serverContent.outputTranscription.text);
                }
              },
              onerror: (e) => {
                console.error("[GeminiCore] SDK Error:", e);
                setIsConnected(false);
                setIsConnecting(false);
                stopAudio(0);

                // If this is a transient SDK error (like the "Operation not implemented" glitch),
                // we treat it as an interruption and try to resume.
                if (reconnectAttemptRef.current < 3) {
                  reconnectAttemptRef.current += 1;
                  console.log(
                    `[GeminiCore] Transient SDK error. Attempt ${reconnectAttemptRef.current}/3`,
                  );
                  toast.warning("Connection lost. Reconnecting...", { id: "ws-retry" });
                  setTimeout(() => {
                    if (connectRef.current) void connectRef.current(true);
                  }, 1000);
                  return;
                }

                const message = e instanceof Error ? e.message : "Connection error";
                setError(message);
                notifyModelError(DEFAULT_GEMINI_LIVE_MODEL, e);
                setModelAvailability("unavailable");
                resolve(false);
              },
              onclose: (e) => {
                console.log("[GeminiCore] Closed:", e?.reason, "code:", e?.code);
                sessionRef.current = null;
                isConnectedRef.current = false;
                if (keepAliveIntervalRef.current !== null) {
                  clearInterval(keepAliveIntervalRef.current);
                  keepAliveIntervalRef.current = null;
                }
                setIsConnected(false);
                setIsConnecting(false);
                stopAudio(0);

                // User pressed Stop — clean exit
                if (manualCloseRef.current) return;

                const reason = (e?.reason ?? "").toLowerCase();
                const code = e?.code ?? 0;

                // ── Gemini API session timeout ──────────────────────────────────
                if (reason.includes("deadline") || reason.includes("expired")) {
                  toast.info("Session timed out", {
                    id: "session-timeout",
                    description:
                      "The Live session reached its maximum duration. Tap Start to continue.",
                    duration: 8000,
                  });
                  return;
                }

                // ── Hard protocol / permanent errors ─────────────────────────────
                if (code && [1002, 1003, 1007, 1008].includes(code)) {
                  const message = `Closed: ${e?.reason || code}`;
                  setError(message);
                  if (code === 1008) {
                    notifyModelError(
                      DEFAULT_GEMINI_LIVE_MODEL,
                      new Error(e?.reason ?? `WS ${code}`),
                    );
                    setModelAvailability("unavailable");
                  }
                  return;
                }

                // ── Transient / Unexpected closures (1011, 1006, etc) ────────────
                // We retry up to 3 times CONSECUTIVELY.
                if (reconnectAttemptRef.current < 3) {
                  reconnectAttemptRef.current += 1;
                  console.log(
                    `[GeminiCore] Closure (code ${code}). Attempt ${reconnectAttemptRef.current}/3`,
                  );
                  toast.warning("Connection interrupted. Reconnecting...", { id: "ws-retry" });
                  setTimeout(() => {
                    if (connectRef.current) void connectRef.current(true);
                  }, 1000);
                  return;
                }

                toast.error("Connection failed after 3 attempts", {
                  id: "ws-fail",
                  description: "Please check your network or try again later.",
                });
                resolve(false);
              },
            },
          })
          .then((session) => {
            sessionRef.current = session;
          })
          .catch((err) => {
            console.error("[GeminiCore] Connection Handshake Fail:", err);

            // Handshake failure (e.g. gRPC 503 or transient network)
            if (reconnectAttemptRef.current < 3) {
              reconnectAttemptRef.current += 1;
              console.log(
                `[GeminiCore] Handshake failed. Attempt ${reconnectAttemptRef.current}/3`,
              );
              setTimeout(() => {
                if (connectRef.current) void connectRef.current(true);
              }, 1500); // Slower backoff for handshake fails
              return;
            }

            const errMsg = err instanceof Error ? err.message : "Connect failed";
            setError(errMsg);
            setIsConnecting(false);
            notifyModelError(DEFAULT_GEMINI_LIVE_MODEL, err);
            setModelAvailability("unavailable");
            resolve(false);
          });
      });
    },
    [user, systemInstruction, tools, onToolCall, onTranscript, stopAudio, resumePrompt],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // ---------------------------------------------------------------------------
  // Sending Methods
  // ---------------------------------------------------------------------------
  const sendVideoFrame = useCallback((base64Data: string, mimeType = "image/jpeg") => {
    // Basic check: do we have a session?
    const session = sessionRef.current;
    if (!session) return;

    try {
      session.sendRealtimeInput({
        media: {
          mimeType,
          data: base64Data,
        },
      });
    } catch (e) {
      console.error("[GeminiCore] Send Video Error:", e);
    }
  }, []);

  const sendAudioChunk = useCallback((data: Blob | Int16Array) => {
    const session = sessionRef.current;
    if (!session) return;

    try {
      if (data instanceof Int16Array) {
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(data.buffer)));
        session.sendRealtimeInput({
          media: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Data,
          },
        });
      }
    } catch (e) {
      console.error("[GeminiCore] Send Audio Error:", e);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAudio(0);
      if (audioContextRef.current) void audioContextRef.current.close();
    };
  }, [stopAudio]);

  return {
    isConnected,
    isConnecting,
    error,
    errorCode,
    errorMessage,
    modelAvailability,
    checkModelAvailability,
    connect,
    disconnect,
    sendVideoFrame,
    sendAudioChunk,
  };
}
