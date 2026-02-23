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
  onToolCall?: (toolCall: LiveServerMessage["toolCall"]) => void;
  onTranscript?: (text: string) => void;
  resumePrompt?: string;
}

export function useGeminiCore({
  systemInstruction,
  tools,
  mode,
  onToolCall,
  onTranscript,
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
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

        ws.onmessage = async (event) => {
          let payload: unknown;
          try {
            payload = JSON.parse(event.data);
          } catch {
            return;
          }

          const msg = payload as {
            interrupted?: boolean;
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

          // Trace log for raw payload (excluding heavy base64 audio parts for readability)
          if (DEBUG_MODE) {
            const partTypes =
              msg.content?.parts?.map((p) =>
                p.inlineData || p.inline_data
                  ? "audio"
                  : p.functionCall || p.function_call
                    ? "tool_call"
                    : "unknown",
              ) || [];
            logTrace(`Incoming Event [${partTypes.join(", ")}]`, payload);
          }

          // 1. Interruption
          if (msg.interrupted === true) {
            console.log("[GeminiCore] Interrupted by ADK (Barge-in).");
            stopAudio(0);
            return;
          }

          // 2. Audio Playback
          // ADK Event payload JSON maps content to msg.content
          const content = msg.content;
          const parts = content?.parts || [];

          for (const part of parts) {
            const inlineData = part.inlineData || part.inline_data;
            // Native audio PCM is sent as base64 inside inline_data
            if (inlineData?.data && inlineData.mimeType?.startsWith("audio/")) {
              audioRecvCountRef.current += 1;
              if (audioRecvCountRef.current % 30 === 0) {
                logTrace(`Received ${audioRecvCountRef.current} PCM Audio Blocks from Relay`);
              }
              try {
                const ctx = audioContextRef.current;
                if (!ctx) continue;
                if (ctx.state === "suspended") await ctx.resume();

                const audioBuffer = await decodeAudioData(decode(inlineData.data), ctx, 24000);

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
                console.error("[GeminiCore] Audio playback error:", e);
              }
            }
          }

          // 3. Tool Calls (ADK maps them in action/functionCall structures within content)
          // Look for functionCall inside parts
          for (const part of parts) {
            const functionCall = part.functionCall || part.function_call;
            if (functionCall && onToolCall) {
              // We wrap it in a mock LiveServerMessage toolCall for the legacy frontend bridge
              onToolCall({
                functionCalls: [functionCall as { name: string; args: Record<string, unknown> }],
              } as unknown as LiveServerMessage["toolCall"]);
            }
          }

          // 4. Transcript
          const transcript = msg.outputTranscription || msg.output_transcription;
          const isFinal = (payload as { partial?: boolean }).partial === false;

          if (transcript?.text && onTranscript) {
            // Only fire the transcript when it is marked as finished to avoid doubles
            const isFinished = (transcript as { finished?: boolean }).finished === true;
            if (isFinished || isFinal) {
              onTranscript(transcript.text);
            }
          }
        };

        ws.onerror = (e) => {
          console.error("[GeminiCore] WebSocket Error:", e);
          setIsConnected(false);
          setIsConnecting(false);
          stopAudio(0);

          if (reconnectAttemptRef.current < 3) {
            reconnectAttemptRef.current += 1;
            toast.warning("Connection lost. Reconnecting...", { id: "ws-retry" });
            setTimeout(() => {
              if (connectRef.current) void connectRef.current(true);
            }, 1000);
            return;
          }
          setError("Connection error to local relay.");
          resolve(false);
        };

        ws.onclose = (e) => {
          socketRef.current = null;
          isConnectedRef.current = false;
          setIsConnected(false);
          setIsConnecting(false);
          stopAudio(0);
          resolve(false);
        };
      });
    },
    [user, mode, onToolCall, onTranscript, stopAudio, resumePrompt],
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
