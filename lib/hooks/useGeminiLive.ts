"use client";

import { GoogleGenAI, type LiveServerMessage, Modality } from "@google/genai";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_GEMINI_LIVE_MODEL,
  SPATIAL_SYSTEM_INSTRUCTION,
  extractCoordinateTuples,
  tupleToHighlight,
} from "@/lib/api/gemini_websocket";
import { useAuth } from "@/lib/auth/auth-context";
import { GEMINI_TOOLS } from "@/lib/gemini/tools";
import type { Highlight } from "@/lib/types";
import { decode, decodeAudioData, encode } from "@/lib/utils/audio";

type LiveSession = Awaited<ReturnType<GoogleGenAI["live"]["connect"]>>;

interface TrackAndHighlightArgs {
  ymin: number | string;
  xmin: number | string;
  ymax: number | string;
  xmax: number | string;
  label: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGeminiLive() {
  // SDK session ref — replaces the raw WebSocket ref
  const sessionRef = useRef<LiveSession | null>(null);
  const manualCloseRef = useRef(false);

  // Audio Output State (SDK delivers PCM at 24kHz)
  const audioContextRef = useRef<AudioContext | null>(null);
  // Store tuple of [Source, Gain] to handle fades
  const activeSourcesRef = useRef<Set<{ source: AudioBufferSourceNode; gain: GainNode }>>(
    new Set(),
  );
  const nextStartTimeRef = useRef<number>(0);

  const { user } = useAuth();

  const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [modelAvailability, setModelAvailability] = useState<
    "unknown" | "checking" | "available" | "unavailable"
  >("unknown");
  const [latestTranscript, setLatestTranscript] = useState<string>("");

  // Sending lock — prevents simultaneous audio + video frames from racing
  const isSendingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Audio helpers
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
          // Fade out gracefully
          const currentTime = ctx.currentTime;
          gain.gain.cancelScheduledValues(currentTime);
          gain.gain.setValueAtTime(gain.gain.value, currentTime);
          gain.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
          source.stop(currentTime + fadeOutDuration);
        } else {
          // Stop immediately
          source.stop();
        }
      } catch {
        // Ignore errors for already-stopped sources
      }
    }

    // If fading, we let the sources naturally clear themselves via onended.
    // If immediate, we clear ref.
    if (fadeOutDuration === 0) {
      activeSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    } else {
      // Reset next start time immediately so new audio starts "fresh"
      nextStartTimeRef.current = 0;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Model availability check (REST ping to validate API key)
  // ---------------------------------------------------------------------------

  const checkModelAvailability = useCallback(async (): Promise<boolean> => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    console.log("[GeminiLive] Checking model availability...", {
      model: DEFAULT_GEMINI_LIVE_MODEL,
    });

    if (!key?.startsWith("AIza")) {
      console.error("[GeminiLive] Invalid API key format.");
      setModelAvailability("unavailable");
      return false;
    }

    setModelAvailability("checking");

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_LIVE_MODEL}?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, { method: "GET" });
      console.log("[GeminiLive] Model check response:", response.status, response.statusText);

      if (response.ok) {
        setModelAvailability("available");
        return true;
      }

      // 429 = quota exceeded, but key and model are valid
      if (response.status === 429) {
        console.warn("[GeminiLive] Quota exceeded (429), treating as available.");
        setModelAvailability("available");
        return true;
      }

      console.error("[GeminiLive] Model unavailable:", response.status);
      setModelAvailability("unavailable");
      return false;
    } catch (e) {
      // Network offline — let the connect attempt surface the real error
      console.warn("[GeminiLive] Availability check failed (network?), assuming available.", e);
      setModelAvailability("available");
      return true;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Disconnect
  // ---------------------------------------------------------------------------

  const disconnect = useCallback(() => {
    console.log("[GeminiLive] Disconnecting...");
    manualCloseRef.current = true;

    try {
      sessionRef.current?.close();
    } catch {
      // ignore
    }
    sessionRef.current = null;

    setIsConnected(false);
    setIsConnecting(false);

    stopAudio(0); // Immediate stop on disconnect
    if (audioContextRef.current?.state !== "closed") {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    }
  }, [stopAudio]);

  // ---------------------------------------------------------------------------
  // Connect (via @google/genai SDK — no raw WebSocket payload management)
  // ---------------------------------------------------------------------------

  const connect = useCallback(async (): Promise<boolean> => {
    console.log("[GeminiLive] Connect called.");
    manualCloseRef.current = false;

    if (!user) {
      const message = "Sign in required before connecting to Gemini Live.";
      console.error("[GeminiLive] Auth Error:", message);
      setError(message);
      setErrorCode("AUTH_REQUIRED");
      setErrorMessage(message);
      return false;
    }

    if (sessionRef.current) {
      console.log("[GeminiLive] Already connected.");
      setIsConnected(true);
      return true;
    }

    setIsConnecting(true);
    setError(null);
    setErrorCode(undefined);
    setErrorMessage(undefined);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      const message = "Missing NEXT_PUBLIC_GOOGLE_API_KEY";
      console.error("[GeminiLive] Config Error:", message);
      setError(message);
      setIsConnecting(false);
      return false;
    }

    // Initialise output AudioContext (24kHz — model outputs at 24kHz)
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }

    return new Promise((resolve) => {
      const ai = new GoogleGenAI({ apiKey });

      /**
       * The @google/genai SDK handles all wire-format details:
       * - Correct JSON field names (realtimeInput vs realtime_input)
       * - Correct mime types and payload structure
       * - Session setup and handshake
       *
       * Reference (working AI Studio implementation):
       * https://ai.google.dev/gemini-api/docs/live
       */
      ai.live
        .connect({
          model: DEFAULT_GEMINI_LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Puck" },
              },
            },
            // Enable transcription of model output (what Gemini says)
            // Enable transcription of model output (what Gemini says)
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: SPATIAL_SYSTEM_INSTRUCTION,
            tools: [GEMINI_TOOLS],
          },
          callbacks: {
            onopen: () => {
              console.log("[GeminiLive] SDK session opened.");
              setIsConnecting(false);
              setIsConnected(true);
              resolve(true);
            },

            onmessage: async (msg: LiveServerMessage) => {
              // 1. Handle interruption
              if (msg.serverContent?.interrupted) {
                console.log("[GeminiLive] Interrupted.");
                stopAudio(0.5); // Graceful 500ms fade out
                return;
              }

              // 2. Play audio parts
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
                    console.error("[GeminiLive] Audio playback error:", e);
                  }
                }

                // 3. Handle text parts for coordinate extraction (Legacy/Fallback)
                if (part.text) {
                  console.log("[GeminiLive] Text response:", part.text);
                  setLatestTranscript(part.text);

                  const tuples = extractCoordinateTuples(part.text);
                  if (tuples.length) {
                    setActiveHighlights(tuples.map((t, i) => tupleToHighlight(t, i)));
                  }
                }
              }

              // 4. Handle Tool Calls (Highlighting)
              if (msg.toolCall?.functionCalls) {
                console.log("[GeminiLive] Tool Call received:", msg.toolCall);
                for (const fc of msg.toolCall.functionCalls) {
                  if (fc.name === "track_and_highlight") {
                    const { ymin, xmin, ymax, xmax, label } =
                      fc.args as unknown as TrackAndHighlightArgs;
                    console.log("[GeminiLive] Highlighter Tool:", {
                      label,
                      ymin,
                      xmin,
                      ymax,
                      xmax,
                    });

                    const newHighlight: Highlight = {
                      id: crypto.randomUUID(),
                      objectName: label || "Detected Object",
                      ymin: Number(ymin),
                      xmin: Number(xmin),
                      ymax: Number(ymax),
                      xmax: Number(xmax),
                      timestamp: Date.now(),
                    };

                    setActiveHighlights((prev) => [...prev, newHighlight]);

                    // Send response back to model so it knows the tool executed
                    if (sessionRef.current) {
                      sessionRef.current.sendToolResponse({
                        functionResponses: [
                          {
                            id: fc.id,
                            name: fc.name,
                            response: { result: { success: true } },
                          },
                        ],
                      });
                    }
                  }
                }
              }

              // 5. Output transcription (what the model says — streamed text)
              if (msg.serverContent?.outputTranscription?.text) {
                const transcriptText = msg.serverContent.outputTranscription.text;
                setLatestTranscript((prev) => prev + transcriptText);
              }

              // 6. Clear transcript on turn complete
              if (msg.serverContent?.turnComplete) {
                // Short delay so the UI shows the final transcript before clearing
                setTimeout(() => setLatestTranscript(""), 3000);
              }
            },

            onerror: (e) => {
              console.error("[GeminiLive] SDK error:", e);
              const message = e instanceof Error ? e.message : "Gemini Live connection error.";
              setError(message);
              setErrorCode("SDK_ERROR");
              setErrorMessage(message);
              setIsConnected(false);
              setIsConnecting(false);
              resolve(false);
            },

            onclose: (e) => {
              console.log("[GeminiLive] SDK session closed.", e?.reason ?? "");
              sessionRef.current = null;
              setIsConnected(false);
              setIsConnecting(false);
              stopAudio(0);

              // Only report error if this wasn't a manual disconnect
              if (!manualCloseRef.current && e?.code && [1002, 1003, 1007, 1008].includes(e.code)) {
                const message = `Connection closed with error: ${e.reason || e.code}`;
                setError(message);
                setErrorCode(`WS_${e.code}`);
                setErrorMessage(message);
              }
            },
          },
        })
        .then((session) => {
          sessionRef.current = session;
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Failed to connect to Gemini Live.";
          console.error("[GeminiLive] Connect failed:", message);
          setError(message);
          setErrorCode("CONNECT_FAILED");
          setIsConnecting(false);
          resolve(false);
        });
    });
  }, [user, stopAudio]);

  // ---------------------------------------------------------------------------
  // sendVideoFrame — delegates to SDK (handles wire format automatically)
  // ---------------------------------------------------------------------------

  const sendVideoFrame = useCallback((base64Data: string, mimeType = "image/jpeg") => {
    if (!sessionRef.current || isSendingRef.current) return;

    isSendingRef.current = true;
    try {
      /**
       * SDK sendRealtimeInput with { media: ... } is the verified working format
       * from the official AI Studio reference implementation. The SDK maps this
       * correctly to realtimeInput.video on the wire.
       */
      sessionRef.current.sendRealtimeInput({
        media: {
          data: base64Data,
          mimeType,
        },
      });
    } catch (e) {
      console.error("[GeminiLive] Failed to send video frame:", e);
    } finally {
      setTimeout(() => {
        isSendingRef.current = false;
      }, 50);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // sendAudioChunk — delegates to SDK (handles wire format automatically)
  // ---------------------------------------------------------------------------

  const sendAudioChunk = useCallback((data: Blob | Int16Array) => {
    if (!sessionRef.current || isSendingRef.current) return;

    isSendingRef.current = true;
    try {
      let base64Data: string;

      if (data instanceof Int16Array) {
        base64Data = encode(new Uint8Array(data.buffer));
      } else {
        // Blob path — convert sync via FileReader for non-async callback compat
        // (AudioWorklet postMessage delivers Float32Array, so this path is rare)
        console.warn("[GeminiLive] Blob audio path invoked — consider passing Int16Array.");
        isSendingRef.current = false;
        return;
      }

      /**
       * SDK sendRealtimeInput with { media: ... } — verified against AI Studio.
       * The SDK maps this to realtimeInput.audio on the wire with the correct
       * mimeType. Input spec: 16-bit PCM, 16kHz, mono.
       */
      sessionRef.current.sendRealtimeInput({
        media: {
          data: base64Data,
          mimeType: "audio/pcm;rate=16000",
        },
      });
    } catch (e) {
      console.error("[GeminiLive] Failed to send audio chunk:", e);
    } finally {
      setTimeout(() => {
        isSendingRef.current = false;
      }, 10);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopAudio(0);
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [stopAudio]);

  return {
    activeHighlights,
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
    latestTranscript,
    clearHighlights: () => setActiveHighlights([]),
  };
}
