"use client";

import { type GoogleGenAI, type LiveServerMessage, Modality, type Tool } from "@google/genai";
import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_GEMINI_LIVE_MODEL } from "@/lib/api/gemini_websocket";
import { useAuth } from "@/lib/auth/auth-context";
import { notifyModelError } from "@/lib/gemini/model-error";
import { decode, decodeAudioData } from "@/lib/utils/audio";
import { toast } from "sonner";

type LiveSession = Awaited<ReturnType<GoogleGenAI["live"]["connect"]>>;

const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === "true";

const logTrace = (msg: string, ...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.debug(
      `%c[Frontend-Trace]%c ${msg}`,
      "color: #3b82f6; font-weight: bold;",
      "color: inherit;",
      ...args,
    );
  }
};
const logInfo = (msg: string, ...args: unknown[]) => {
  console.log(
    `%c[Frontend-Info]%c ${msg}`,
    "color: #10b981; font-weight: bold;",
    "color: inherit;",
    ...args,
  );
};

export interface UseGeminiCoreProps {
  systemInstruction: string;
  tools?: Tool[];
  mode?: "spatial" | "director" | "it-architecture" | string;
  onToolCall?: (
    toolCall: LiveServerMessage["toolCall"],
    metadata: { invocationId?: string },
  ) => void;
  onTranscript?: (text: string, metadata: { invocationId?: string; finished?: boolean }) => void;
  onTurnComplete?: (invocationId?: string) => void;
  resumePrompt?: string;
}

export function useGeminiCore({
  systemInstruction,
  tools,
  mode,
  onToolCall,
  onTranscript,
  onTurnComplete,
  resumePrompt = "The connection to the server was briefly interrupted. Please resume what you were doing exactly where you left off.",
}: UseGeminiCoreProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const manualCloseRef = useRef(false);
  const isConnectedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<{ source: AudioBufferSourceNode; gain: GainNode }>>(
    new Set(),
  );
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingAudioRef = useRef<boolean>(false);
  const isBufferingRef = useRef<boolean>(true); // Anti-jitter cache buffer state
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTurnIdRef = useRef<string>(crypto.randomUUID());

  const audioSendCountRef = useRef(0);
  const audioRecvCountRef = useRef(0);

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
    audioQueueRef.current = []; // Clear pending audio queue
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === "closed") {
      activeSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      return;
    }

    for (const { source, gain } of activeSourcesRef.current) {
      try {
        const currentTime = ctx.currentTime;
        if (fadeOutDuration > 0) {
          gain.gain.cancelScheduledValues(currentTime);
          gain.gain.setValueAtTime(gain.gain.value, currentTime);
          gain.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
          source.stop(currentTime + fadeOutDuration);
        } else {
          gain.gain.cancelScheduledValues(currentTime);
          gain.gain.setValueAtTime(0, currentTime);
          source.stop(currentTime);
          source.disconnect();
        }
      } catch {
        // ignore
      }
    }

    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    isBufferingRef.current = true;
  }, []);

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    logInfo("Disconnecting...");
    manualCloseRef.current = true;
    isConnectedRef.current = false;
    if (keepAliveIntervalRef.current !== null) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    try {
      socketRef.current?.close();
    } catch {
      // ignore
    }
    socketRef.current = null;
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
      logInfo("Connect called.");

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
      if (socketRef.current) {
        setIsConnected(true);
        return true;
      }

      setIsConnecting(true);
      setError(null);
      setErrorCode(undefined);
      setErrorMessage(undefined);

      // Init Audio Context
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const probeCtx = new AudioContextClass();
        audioContextRef.current =
          probeCtx.sampleRate === 24000
            ? probeCtx
            : (() => {
                void probeCtx.close();
                return new AudioContextClass({ sampleRate: probeCtx.sampleRate });
              })();
      }

      return new Promise((resolve) => {
        const baseUrl = process.env.NEXT_PUBLIC_RELAY_WS_URL || "ws://localhost:8000/ws/live";
        const wsUrl = mode ? `${baseUrl}?mode=${mode}` : baseUrl;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          logInfo("Socket opened to local relay.");
          setIsConnecting(false);
          setIsConnected(true);
          isConnectedRef.current = true;
          socketRef.current = ws;
          resolve(true);

          if (reconnectAttemptRef.current > 0) {
            setTimeout(() => {
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(
                  JSON.stringify({
                    text: resumePrompt,
                  }),
                );
              }
            }, 500);
          }

          reconnectAttemptRef.current = 0;

          if (keepAliveIntervalRef.current !== null) {
            clearInterval(keepAliveIntervalRef.current);
          }
          keepAliveIntervalRef.current = setInterval(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({ text: " " }));
            }
          }, 25_000);
        };

        const processAudioQueue = () => {
          if (isProcessingAudioRef.current) return;
          isProcessingAudioRef.current = true;

          const ctx = audioContextRef.current;
          if (!ctx || ctx.state === "closed") {
            isProcessingAudioRef.current = false;
            return;
          }

          try {
            if (ctx.state === "suspended") void ctx.resume();

            // ── CACHE BUFFER (High Water Mark) ──
            // Wait until we have accumulated a minimum number of chunks before playing,
            // to absorb network/generation jitter.
            if (isBufferingRef.current) {
              const MIN_CHUNKS = 40; // ~400-800ms of buffered audio, prevents React UI jitter
              if (audioQueueRef.current.length < MIN_CHUNKS) {
                isProcessingAudioRef.current = false;
                return; // Wait for more chunks
              }
              // Buffer is filled, start playback
              isBufferingRef.current = false;
            }

            // ── CLOCK SYNC ──
            // If the next playback time is in the past (e.g. after a silent pause),
            // resync it to the current context time with a small safety margin.
            if (nextStartTimeRef.current < ctx.currentTime) {
              nextStartTimeRef.current = ctx.currentTime + 0.1;
            }

            // Flush synchronously! Do not yield the event loop / main thread!
            // This pushes everything natively into the AudioContext upfront.
            while (audioQueueRef.current.length > 0) {
              const base64Data = audioQueueRef.current.shift();
              if (!base64Data) continue;

              const audioBuffer = decodeAudioData(decode(base64Data), ctx, 24000);

              // We could have been interrupted while decoding
              if (!isProcessingAudioRef.current || audioContextRef.current?.state === "closed")
                break;

              const startTime = nextStartTimeRef.current;

              // ── BUFFER UNDERRUN (Low Water Mark) ──
              // If the time to play this chunk has already passed, we fell behind.
              if (startTime < ctx.currentTime) {
                logTrace("Buffer underrun. Pausing to rebuild cache buffer...");
                // Enter buffering state to let chunks pile up again
                isBufferingRef.current = true;
                // Re-queue the chunk since we didn't play it
                audioQueueRef.current.unshift(base64Data);
                break;
              }

              const source = ctx.createBufferSource();
              const gain = ctx.createGain();

              source.buffer = audioBuffer;
              source.connect(gain);
              gain.connect(ctx.destination);

              const unit = { source, gain };
              source.onended = () => activeSourcesRef.current.delete(unit);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              activeSourcesRef.current.add(unit);
            }
          } catch (e) {
            console.error("[GeminiCore] Audio playback error in queue:", e);
          } finally {
            isProcessingAudioRef.current = false;
          }
        };

        ws.onmessage = async (event) => {
          let payload: unknown;
          try {
            payload = JSON.parse(event.data);
          } catch {
            return;
          }

          const msg = payload as {
            interrupted?: boolean;
            invocationId?: string;
            content?: {
              parts?: Array<{
                inlineData?: { data: string; mimeType: string };
                inline_data?: { data: string; mimeType: string };
                functionCall?: { name: string; args: Record<string, unknown> };
                function_call?: { name: string; args: Record<string, unknown> };
              }>;
            };
            outputTranscription?: { text: string };
            output_transcription?: { text: string };
          };

          if (DEBUG_MODE) {
            const partTypes =
              msg.content?.parts?.map((p) => {
                const isAudio = p.inlineData || p.inline_data;
                const isTool = p.functionCall || p.function_call;
                return isAudio ? "audio" : isTool ? "tool_call" : "unknown";
              }) || [];
            logTrace(`Incoming Event [${partTypes.join(", ")}]`, payload);
          }

          // Maintain a strict client-side turn ID to reliably isolate separate model responses
          const currentTurnId = currentTurnIdRef.current;

          // 1. Interruption
          if (msg.interrupted === true) {
            logInfo("Barge-in: Interrupted by ADK.");
            audioQueueRef.current = [];
            isProcessingAudioRef.current = false;
            isBufferingRef.current = true;
            stopAudio(0);
            currentTurnIdRef.current = crypto.randomUUID(); // Cycle turn immediately
            return;
          }

          const parts = msg.content?.parts || [];

          for (const part of parts) {
            // 2. Audio Playback
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData?.data && inlineData.mimeType?.startsWith("audio/")) {
              audioRecvCountRef.current += 1;
              if (audioRecvCountRef.current % 30 === 0) {
                logTrace(`Received ${audioRecvCountRef.current} PCM Audio Blocks from Relay`);
              }
              audioQueueRef.current.push(inlineData.data);
              processAudioQueue();
            }

            // 3. Tool Calls
            const functionCall = part.functionCall || part.function_call;
            if (functionCall && onToolCall) {
              onToolCall(
                {
                  functionCalls: [functionCall as { name: string; args: Record<string, unknown> }],
                } as unknown as LiveServerMessage["toolCall"],
                { invocationId: currentTurnId },
              );
            }
          }

          // 4. Transcript
          const transcript = msg.outputTranscription || msg.output_transcription;
          const transcriptFinished =
            (msg as { outputTranscription?: { text: string; finished?: boolean } })
              .outputTranscription?.finished ??
            (msg as { output_transcription?: { text: string; finished?: boolean } })
              .output_transcription?.finished ??
            false;

          if (transcript?.text && onTranscript) {
            onTranscript(transcript.text, {
              invocationId: currentTurnId,
              finished: transcriptFinished,
            });
          }

          // 5. Turn Complete
          const isTurnComplete = (msg as { turnComplete?: boolean }).turnComplete === true;
          if (isTurnComplete) {
            if (onTurnComplete) {
              onTurnComplete(currentTurnId);
            }
            // Cycle turn ID for the next complete model response
            currentTurnIdRef.current = crypto.randomUUID();

            // ── FLUSH CACHE BUFFER ──
            // The generation is complete. Even if we have less than MIN_CHUNKS piled up,
            // play out whatever is at the end of the queue.
            if (audioQueueRef.current.length > 0) {
              isBufferingRef.current = false;
              processAudioQueue();
            }
            // Reset buffering for the next turn to ensure jitter protection
            isBufferingRef.current = true;
          }
        };

        ws.onerror = (e) => {
          console.error("[GeminiCore] WebSocket Error:", e);
          // Note: In WebSockets, onerror doesn't provide fine-grained codes.
          // We handle the specific drop reasons and the reconnection sequence in onclose.
        };

        ws.onclose = (e) => {
          logInfo(`WebSocket closed. Code: ${e.code}, Clean: ${e.wasClean}, Reason: ${e.reason}`);
          socketRef.current = null;
          isConnectedRef.current = false;
          setIsConnected(false);
          setIsConnecting(false);
          stopAudio(0);

          if (!manualCloseRef.current) {
            const isServerError = e.code === 1011;
            const reasonText =
              e.reason ||
              (isServerError
                ? "The Gemini API operation timed out or failed (Deadline Expired)."
                : "Connection was lost abnormally.");

            // Alert the user immediately if it was a server crash / deadline
            if (isServerError) {
              toast.error("Gemini Server Error", {
                description: reasonText,
                duration: 6000,
              });
              setError(reasonText);
              setErrorCode(e.code.toString());
              setErrorMessage(reasonText);
            }

            if (reconnectAttemptRef.current < 3) {
              reconnectAttemptRef.current += 1;
              toast.warning(
                `Connection lost. Reconnecting (Attempt ${reconnectAttemptRef.current}/3)...`,
                {
                  id: "ws-retry",
                },
              );
              setTimeout(() => {
                if (connectRef.current) void connectRef.current(true);
              }, 1000);
              return; // Wait for the reconnect attempt
            }

            // We exceeded reconnect attempts or there's no reason to reconnect
            if (!isServerError) {
              setError("Connection error to local relay.");
            }
            toast.error("Could not reconnect to the server.");
          }

          resolve(false);
        };
      });
    },
    [user, mode, onToolCall, onTranscript, onTurnComplete, stopAudio, resumePrompt],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // ---------------------------------------------------------------------------
  // Sending Methods
  // ---------------------------------------------------------------------------
  const sendVideoFrame = useCallback((base64Data: string, mimeType = "image/jpeg") => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          realtimeInput: { video: { mimeType, data: base64Data } },
        }),
      );
    }
  }, []);

  const sendAudioChunk = useCallback((data: Blob | Int16Array) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (data instanceof Int16Array) {
        audioSendCountRef.current += 1;
        if (audioSendCountRef.current % 50 === 0) {
          logTrace(`Piped ${audioSendCountRef.current} Audio Chunks to Relay (Binary)`);
        }
        socketRef.current.send(data.buffer);
      } else {
        socketRef.current.send(data);
      }
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
