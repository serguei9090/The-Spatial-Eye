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
}

export function useGeminiCore({
  systemInstruction,
  tools,
  onToolCall,
  onTranscript,
}: UseGeminiCoreProps) {
  const sessionRef = useRef<LiveSession | null>(null);
  const manualCloseRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<{ source: AudioBufferSourceNode; gain: GainNode }>>(
    new Set(),
  );
  const nextStartTimeRef = useRef<number>(0);

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

  const connect = useCallback(async (): Promise<boolean> => {
    console.log("[GeminiCore] Connect called.");
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
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
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
              resolve(true);
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
                onToolCall(msg.toolCall);

                // Auto-acknowledge tool calls if they are function calls
                // This is required for the model to continue, but the consumer
                // might want to send a specific response. For now, we ack success.
                // Improve: Let consumer return a promise?
                // Simpler: Just ack here.
                if (msg.toolCall.functionCalls && sessionRef.current) {
                  const responses = msg.toolCall.functionCalls.map((fc) => ({
                    id: fc.id,
                    name: fc.name,
                    response: { result: { success: true } },
                  }));
                  sessionRef.current.sendToolResponse({ functionResponses: responses });
                }
              }

              // 4. Transcript -> Propagate to consumer
              if (msg.serverContent?.outputTranscription?.text && onTranscript) {
                onTranscript(msg.serverContent.outputTranscription.text);
              }
            },
            onerror: (e) => {
              console.error("[GeminiCore] Error:", e);
              const message = e instanceof Error ? e.message : "Connection error";
              setError(message);
              setErrorCode("SDK_ERROR");
              setErrorMessage(message);
              setIsConnected(false);
              setIsConnecting(false);
              // Route all model errors through the shared utility
              notifyModelError(DEFAULT_GEMINI_LIVE_MODEL, e);
              setModelAvailability("unavailable");
              resolve(false);
            },
            onclose: (e) => {
              console.log("[GeminiCore] Closed:", e?.reason, "code:", e?.code);
              sessionRef.current = null;
              setIsConnected(false);
              setIsConnecting(false);
              stopAudio(0);

              // User pressed Stop — clean exit, no toast needed
              if (manualCloseRef.current) return;

              const reason = (e?.reason ?? "").toLowerCase();
              const code = e?.code ?? 0;

              // ── Gemini API session timeout (gRPC DEADLINE_EXCEEDED) ──────────
              // Google closes the WebSocket when the max session duration is hit.
              // This is expected behaviour — not an error in user code.
              if (reason.includes("deadline") || reason.includes("expired")) {
                toast.info("Session timed out", {
                  id: "session-timeout",
                  description:
                    "The Live session reached its maximum duration. Tap Start to continue.",
                  duration: 8000,
                });
                return;
              }

              // ── Hard protocol / billing errors ───────────────────────────────
              if (code && [1002, 1003, 1007, 1008].includes(code)) {
                const message = `Closed: ${e?.reason || code}`;
                setError(message);
                setErrorCode(`WS_${code}`);
                setErrorMessage(message);
                // 1008 = policy violation (billing/quota) — model genuinely unavailable
                if (code === 1008) {
                  notifyModelError(DEFAULT_GEMINI_LIVE_MODEL, new Error(e?.reason ?? `WS ${code}`));
                  setModelAvailability("unavailable");
                }
                return;
              }

              // ── Transient server errors (1011) ────────────────────────────────
              // 1011 = Internal Server Error from Google — this is a temporary
              // hiccup on their side. The model is NOT broken. The user can
              // press Start immediately to reconnect.
              if (code === 1011) {
                toast.warning("Connection interrupted", {
                  id: "ws-1011",
                  description: "Google's server had a temporary error. Tap Start to reconnect.",
                  duration: 6000,
                });
                // Do NOT call setModelAvailability("unavailable") — the model is fine
                return;
              }
            },
          },
        })
        .then((session) => {
          sessionRef.current = session;
        })
        .catch((err) => {
          console.error("[GeminiCore] Fail:", err);
          const errMsg = err instanceof Error ? err.message : "Connect failed";
          setError(errMsg);
          setIsConnecting(false);
          // Route through shared utility — it classifies internally
          notifyModelError(DEFAULT_GEMINI_LIVE_MODEL, err);
          setModelAvailability("unavailable");
          resolve(false);
        });
    });
  }, [user, systemInstruction, tools, onToolCall, onTranscript, stopAudio]);

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
