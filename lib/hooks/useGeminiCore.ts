"use client";

import type { LiveServerMessage } from "@google/genai";
import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_GEMINI_LIVE_MODEL } from "@/lib/api/gemini_websocket";
import { useAuth } from "@/lib/auth/auth-context";
import { useSettings } from "@/lib/store/settings-context";
import { decode, decodeAudioData } from "@/lib/utils/audio";
import { toast } from "sonner";

type LiveSession = Awaited<ReturnType<GoogleGenAI["live"]["connect"]>>;

interface RelayMessage {
  interrupted?: boolean;
  invocationId?: string;
  partial?: boolean;
  turnComplete?: boolean;
  content?: {
    parts?: Array<{
      inlineData?: { data: string; mimeType: string };
      inline_data?: { data: string; mimeType: string };
      functionCall?: { name: string; args: Record<string, unknown> };
      function_call?: { name: string; args: Record<string, unknown> };
    }>;
  };
  outputTranscription?: { text: string; finished?: boolean };
  output_transcription?: { text: string; finished?: boolean };
}

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
  mode?: string;
  onToolCall?: (
    toolCall: LiveServerMessage["toolCall"],
    metadata: { invocationId?: string },
  ) => void;
  onTranscript?: (
    text: string,
    metadata: {
      invocationId?: string;
      finished?: boolean;
      isPartial?: boolean;
    },
  ) => void;
  onTurnComplete?: (invocationId?: string) => void;
  resumePrompt?: string;
  getToken?: () => Promise<string | null>;
}

export function useGeminiCore({
  systemInstruction,
  mode,
  onToolCall,
  onTranscript,
  onTurnComplete,
  getToken,
  resumePrompt = "The connection to the server was briefly interrupted. Please resume what you were doing exactly where you left off.",
}: UseGeminiCoreProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const manualCloseRef = useRef(false);
  const isConnectedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<
    Set<{ source: AudioBufferSourceNode; gain: GainNode }>
  >(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingAudioRef = useRef<boolean>(false);
  const isBufferingRef = useRef<boolean>(true); // Anti-jitter cache buffer state
  const currentTurnIdRef = useRef<string>(crypto.randomUUID());
  const isMutedRef = useRef(false); // Track interrupted state to discard late audio

  const audioSendCountRef = useRef(0);
  const audioRecvCountRef = useRef(0);

  // Reconnection refs
  const reconnectAttemptRef = useRef(0);
  const connectRef = useRef<
    ((isAutoReconnect?: boolean) => Promise<boolean>) | null
  >(null);
  const { user } = useAuth();
  const { t, byokKey } = useSettings();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [modelAvailability, setModelAvailability] = useState<
    "unknown" | "checking" | "available" | "unavailable"
  >("unknown");

  // ---------------------------------------------------------------------------
  // Check Model Availability
  // ---------------------------------------------------------------------------
  const checkModelAvailability = useCallback(async (): Promise<boolean> => {
    // If a BYOK key is explicitly provided, validate its format first.
    if (byokKey?.trim()) {
      if (!byokKey.trim().startsWith("AIza")) {
        setModelAvailability("unavailable");
        toast.error("Invalid API key format. Keys must start with 'AIza'.", {
          duration: 6000,
        });
        return false;
      }

      setModelAvailability("checking");
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${DEFAULT_GEMINI_LIVE_MODEL}?key=${encodeURIComponent(byokKey)}`;
        const response = await fetch(url, { method: "GET" });
        if (response.ok || response.status === 429) {
          setModelAvailability("available");
          return true;
        }
        setModelAvailability("unavailable");
        if (response.status === 400) {
          toast.error("Invalid API key. Please check your key and try again.", {
            duration: 6000,
          });
        } else if (response.status === 401) {
          toast.error(
            "API key is not authorized. Please verify it in AI Studio.",
            {
              duration: 6000,
            },
          );
        } else if (response.status === 403) {
          toast.error(t.toasts.accessDenied, { duration: 6000 });
        } else {
          toast.error(
            `API key check failed (HTTP ${response.status}). Please try again.`,
            {
              duration: 6000,
            },
          );
        }
        return false;
      } catch {
        // Network error — be optimistic
        setModelAvailability("available");
        return true;
      }
    }

    // No BYOK key — ask the backend if IT has a server-side key configured.
    // This avoids opening a WebSocket that will immediately be rejected.
    setModelAvailability("checking");
    try {
      // Derive backend HTTP base from the WS relay URL env var:
      // NEXT_PUBLIC_RELAY_URL = ws://localhost:8000/ws/live
      //                       → http://localhost:8000
      const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL ?? "";
      const backendBase = relayUrl
        ? relayUrl.replace(/^wss?:/, "http:").replace(/\/ws\/live$/, "")
        : ""; // Use relative paths if no explicit relay URL is provided. Works with Next.js rewrites/proxies.
      const res = await fetch(`${backendBase}/api/status`);
      if (res.ok) {
        const data = (await res.json()) as { has_server_key: boolean };
        if (!data.has_server_key) {
          setModelAvailability("unavailable");
          toast.error(
            "No API key available. Please use the key (🔑) icon to set your key.",
            {
              duration: 6000,
            },
          );
          return false;
        }
        setModelAvailability("available");
        return true;
      }
    } catch {
      // Can't reach backend at all — let the WebSocket attempt and fail naturally
    }
    setModelAvailability("available");
    return true;
  }, [t.toasts.accessDenied, byokKey]);

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
    try {
      socketRef.current?.close();
    } catch {
      // ignore
    }
    socketRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    stopAudio(0);
    isMutedRef.current = false;
    if (audioContextRef.current?.state !== "closed") {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    }
  }, [stopAudio]);

  const connect = useCallback(
    async (
      isAutoReconnect = false,
      token?: string | null,
    ): Promise<boolean> => {
      logInfo("Connect called.");

      let activeToken = token;
      if (!activeToken && getToken) {
        logInfo("Fetching auth token...");
        activeToken = await getToken();
      }

      if (!isAutoReconnect) {
        reconnectAttemptRef.current = 0;
      }
      manualCloseRef.current = false;

      if (!user) {
        const msg = t.toasts.authRequired;
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
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        const AudioContextClass =
          globalThis.AudioContext ||
          (globalThis as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const probeCtx = new AudioContextClass();
        audioContextRef.current =
          probeCtx.sampleRate === 24000
            ? probeCtx
            : (() => {
                void probeCtx.close();
                return new AudioContextClass({
                  sampleRate: probeCtx.sampleRate,
                });
              })();
      }

      return new Promise((resolve) => {
        let baseUrl = process.env.NEXT_PUBLIC_RELAY_WS_URL;
        if (!baseUrl) {
          const protocol =
            globalThis.location.protocol === "https:" ? "wss:" : "ws:";
          baseUrl = `${protocol}//${globalThis.location.host}/ws/live`;
        }

        const params = new URLSearchParams();
        if (mode) params.append("mode", mode);
        if (activeToken) params.append("token", activeToken);

        // Pass BYOK key to backend
        if (byokKey) {
          params.append("api_key", byokKey);
        }

        const wsUrl = `${baseUrl}?${params.toString()}`;
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
              const MIN_CHUNKS =
                mode === "storyteller"
                  ? 40
                  : mode === "it-architecture"
                    ? 15
                    : 2;
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

              const audioBuffer = decodeAudioData(
                decode(base64Data),
                ctx,
                24000,
              );

              // We could have been interrupted while decoding
              if (
                !isProcessingAudioRef.current ||
                audioContextRef.current?.state === "closed"
              )
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

          const maybeError = payload as { error?: string; message?: string };
          if (maybeError.error) {
            if (
              maybeError.error === "MISSING_API_KEY" ||
              maybeError.error === "AUTH_REQUIRED" ||
              maybeError.error === "AUTH_INVALID"
            ) {
              toast.error(maybeError.message || "Connection error", {
                duration: 6000,
              });
              manualCloseRef.current = true;
              ws.close();
              resolve(false); // <--- Crucial fix: resolve the pending connection attempt as failed!
              return;
            }
          }

          const msg = payload as RelayMessage;

          if (DEBUG_MODE) {
            const partTypes =
              msg.content?.parts?.map((p) => {
                const isAudio = p.inlineData || p.inline_data;
                const isTool = p.functionCall || p.function_call;
                return isAudio
                  ? "audio"
                  : isTool
                    ? "tool_call"
                    : ("unknown" as const);
              }) || [];
            logTrace(`Incoming Event [${partTypes.join(", ")}]`, payload);
          }

          // Maintain a strict client-side turn ID to reliably isolate separate model responses
          const currentTurnId = currentTurnIdRef.current;

          // 1. Interruption
          if (msg.interrupted === true) {
            logInfo("Barge-in: Interrupted by ADK.");
            isMutedRef.current = true; // Mark this turn as interrupted
            audioQueueRef.current = [];
            isProcessingAudioRef.current = false;
            isBufferingRef.current = true;
            stopAudio(0); // Immediate stop — no fade, user wants silence NOW
            currentTurnIdRef.current = crypto.randomUUID(); // Cycle turn immediately
            return;
          }

          const parts = msg.content?.parts || [];

          for (const part of parts) {
            // 2. Audio Playback
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData?.data && inlineData.mimeType?.startsWith("audio/")) {
              // Drop audio that belongs to an interrupted turn (late arrivals)
              if (isMutedRef.current) {
                continue;
              }
              audioRecvCountRef.current += 1;
              if (audioRecvCountRef.current % 30 === 0) {
                logTrace(
                  `Received ${audioRecvCountRef.current} PCM Audio Blocks from Relay`,
                );
              }
              audioQueueRef.current.push(inlineData.data);
              processAudioQueue();
            }

            // 3. Tool Calls
            const functionCall = part.functionCall || part.function_call;
            if (functionCall && onToolCall) {
              onToolCall(
                {
                  functionCalls: [
                    functionCall as {
                      name: string;
                      args: Record<string, unknown>;
                    },
                  ],
                } as unknown as LiveServerMessage["toolCall"],
                { invocationId: currentTurnId },
              );
            }
          }

          // 4. Transcript
          const transcript =
            msg.outputTranscription || msg.output_transcription;
          const isPartial = msg.partial ?? true;
          const transcriptFinished =
            msg.outputTranscription?.finished ??
            msg.output_transcription?.finished ??
            false;

          if (transcript?.text && onTranscript) {
            onTranscript(transcript.text, {
              invocationId: currentTurnId,
              finished: transcriptFinished,
              isPartial: isPartial,
            });
          }

          // 5. Turn Complete
          const isTurnComplete = msg.turnComplete === true;
          if (isTurnComplete) {
            if (onTurnComplete) {
              onTurnComplete(currentTurnId);
            }
            // Cycle turn ID for the next complete model response
            currentTurnIdRef.current = crypto.randomUUID();

            // If this turn was interrupted, drain any remaining late data
            if (isMutedRef.current) {
              audioQueueRef.current = [];
              isMutedRef.current = false;
              isBufferingRef.current = true;
            } else {
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
          }
        };

        ws.onerror = (e) => {
          console.error("[GeminiCore] WebSocket Error:", e);
        };

        ws.onclose = (e) => {
          logInfo(
            `WebSocket closed. Code: ${e.code}, Clean: ${e.wasClean}, Reason: ${e.reason}`,
          );
          socketRef.current = null;
          isConnectedRef.current = false;
          setIsConnected(false);
          setIsConnecting(false);
          stopAudio(0);

          if (!manualCloseRef.current) {
            if (e.code === 1008) {
              if (e.reason) {
                toast.error(e.reason, { duration: 6000 });
              }
              // Explicitly signal this connection run failed to the caller
              resolve(false);
              return;
            }

            const isServerError = e.code === 1011;
            const reasonText =
              e.reason ||
              (isServerError
                ? t.toasts.deadlineExceeded
                : t.toasts.connectionAbnormal);

            if (isServerError) {
              toast.error(t.toasts.serverError, {
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
                t.toasts.reconnecting.replace(
                  "{attempt}",
                  reconnectAttemptRef.current.toString(),
                ),
                {
                  id: "ws-retry",
                },
              );
              setTimeout(() => {
                if (connectRef.current) void connectRef.current(true);
              }, 1000);
              return;
            }

            if (!isServerError) {
              setError(t.toasts.relayError);
            }
            toast.error(t.toasts.reconnectFailed);
          }

          resolve(false);
        };
      });
    },
    [
      user,
      mode,
      onToolCall,
      onTranscript,
      onTurnComplete,
      stopAudio,
      resumePrompt,
      getToken,
      t,
      byokKey,
    ],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // ---------------------------------------------------------------------------
  // Sending Methods
  // ---------------------------------------------------------------------------
  const sendVideoFrame = useCallback(
    (
      base64Data: string,
      mimeType = "image/jpeg",
      width?: number,
      height?: number,
    ) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        if (width && height) {
          logTrace(`Piping ${width}x${height} video frame to Relay`);
        }
        socketRef.current.send(
          JSON.stringify({
            realtimeInput: {
              video: { mimeType, data: base64Data, width, height },
            },
          }),
        );
      }
    },
    [],
  );

  const sendAudioChunk = useCallback((data: Blob | Int16Array) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (data instanceof Int16Array) {
        audioSendCountRef.current += 1;
        if (audioSendCountRef.current % 50 === 0) {
          logTrace(
            `Piped ${audioSendCountRef.current} Audio Chunks to Relay (Binary)`,
          );
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

  const [isAiTalking, setIsAiTalking] = useState(false);

  // Sync isAiTalking with activeSourcesRef
  useEffect(() => {
    const interval = setInterval(() => {
      const currentlyTalking = activeSourcesRef.current.size > 0;
      setIsAiTalking(currentlyTalking);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    isConnecting,
    isAiTalking,
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
