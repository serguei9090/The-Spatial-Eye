"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_GEMINI_LIVE_MODEL,
  buildGeminiWsUrl,
  extractAudioFromLiveServerMessage,
  extractCoordinateTuples,
  extractTextsFromLiveServerMessage,
  isInterrupted,
  sendSetupMessage,
  tupleToHighlight,
} from "@/lib/api/gemini_websocket";
import { useAuth } from "@/lib/auth/auth-context";
import type { Highlight } from "@/lib/types";
import { decode, decodeAudioData } from "@/lib/utils/audio";

export function useGeminiLive() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const manualCloseRef = useRef(false);
  // Track whether the socket has successfully opened so the onclose handler
  // knows whether to attempt a reconnect or just surface the error.
  const hasOpenedRef = useRef(false);

  // Audio Output State
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
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

  // ---------------------------------------------------------------------------
  // Audio helpers
  // ---------------------------------------------------------------------------

  const stopAudio = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore errors if source is already stopped
      }
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  // ---------------------------------------------------------------------------
  // Model availability check
  // ---------------------------------------------------------------------------

  /**
   * Pings the Gemini REST API to verify the API key is valid and the Live
   * model is accessible. Falls back gracefully if the network call fails.
   */
  const checkModelAvailability = useCallback(async (): Promise<boolean> => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!key?.startsWith("AIza")) {
      setModelAvailability("unavailable");
      return false;
    }

    setModelAvailability("checking");

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_LIVE_MODEL}?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, { method: "GET" });

      if (response.ok) {
        setModelAvailability("available");
        return true;
      }

      // 429 = quota exceeded but key and model are valid
      if (response.status === 429) {
        setModelAvailability("available");
        return true;
      }

      setModelAvailability("unavailable");
      return false;
    } catch {
      // Network offline — assume available so we don't block the user, the
      // WebSocket connection attempt will surface the real error.
      setModelAvailability("available");
      return true;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Disconnect
  // ---------------------------------------------------------------------------

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);

    stopAudio();
    if (audioContextRef.current?.state !== "closed") {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    }
  }, [stopAudio]);

  // ---------------------------------------------------------------------------
  // Connect
  // ---------------------------------------------------------------------------

  const connect = useCallback(async (): Promise<boolean> => {
    manualCloseRef.current = false;
    hasOpenedRef.current = false;

    if (!user) {
      const message = "Sign in required before connecting to Gemini Live.";
      setError(message);
      setErrorCode("AUTH_REQUIRED");
      setErrorMessage(message);
      return false;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
      setError(message);
      setIsConnecting(false);
      return false;
    }

    // Initialise AudioContext on connect (must be triggered by user gesture)
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioContextClass =
        window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }

    return new Promise((resolve) => {
      const wsUrl = buildGeminiWsUrl(apiKey);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        hasOpenedRef.current = true;
        reconnectRef.current = 0;

        // ✅ FIX: Send the BidiGenerateContent setup message so Gemini knows
        // the model, system instructions, and response modalities.
        sendSetupMessage(ws, DEFAULT_GEMINI_LIVE_MODEL);

        setIsConnecting(false);
        setIsConnected(true);
        resolve(true);
      };

      ws.onmessage = async (event) => {
        const rawMessage = String(event.data);

        // 1. Handle Interruption
        if (isInterrupted(rawMessage)) {
          stopAudio();
          return;
        }

        // 2. Handle Audio
        const audioData = extractAudioFromLiveServerMessage(rawMessage);
        if (audioData && audioContextRef.current) {
          try {
            const ctx = audioContextRef.current;
            // Resume context if suspended by browser auto-play policy
            if (ctx.state === "suspended") {
              await ctx.resume();
            }

            const decodedBuffer = await decodeAudioData(decode(audioData), ctx, 24000);

            // Schedule audio chunks sequentially to avoid gaps / overlaps
            const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const source = ctx.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(ctx.destination);

            source.onended = () => {
              activeSourcesRef.current.delete(source);
            };

            source.start(startTime);
            nextStartTimeRef.current = startTime + decodedBuffer.duration;
            activeSourcesRef.current.add(source);
          } catch (e) {
            console.error("Audio playback error", e);
          }
        }

        // 3. Handle Coordinates (Spatial Eye) and Text
        const responseText = extractTextsFromLiveServerMessage(rawMessage).join("\n");
        if (responseText) {
          setLatestTranscript(responseText);
        }

        const tuples = extractCoordinateTuples(responseText);
        if (tuples.length) {
          setActiveHighlights(tuples.map((tuple, index) => tupleToHighlight(tuple, index)));
        }
      };

      ws.onerror = () => {
        const message = "Gemini Live connection error.";
        setError(message);
        setErrorCode("WS_ERROR");
        setErrorMessage(message);
        // Do not resolve here — onclose will always fire after onerror
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        setIsConnected(false);
        setIsConnecting(false);

        // Only auto-reconnect if:
        // - The user did not manually disconnect
        // - We haven't exceeded the retry limit
        // - The close code is not a protocol/auth error (which retrying won't fix)
        const isProtocolError = [1002, 1003, 1007, 1008].includes(event.code);
        const shouldRetry =
          !manualCloseRef.current &&
          reconnectRef.current < 4 &&
          !isProtocolError;

        if (shouldRetry) {
          const delay = Math.min(500 * 2 ** reconnectRef.current, 5000);
          reconnectRef.current += 1;
          window.setTimeout(() => {
            void connect();
          }, delay);
        } else {
          stopAudio();
        }

        // Only resolve(false) if the socket never successfully opened —
        // otherwise this Promise was already resolved(true) in onopen.
        if (!hasOpenedRef.current) {
          resolve(false);
        }
      };
    });
  }, [user, stopAudio]);

  // ---------------------------------------------------------------------------
  // sendVideoFrame
  // ---------------------------------------------------------------------------

  const sendVideoFrame = useCallback((base64Data: string, mimeType = "image/webp") => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        realtime_input: {
          media_chunks: [
            {
              mime_type: mimeType,
              data: base64Data,
            },
          ],
        },
      }),
    );
  }, []);

  // ---------------------------------------------------------------------------
  // sendAudioChunk
  // ---------------------------------------------------------------------------

  /**
   * Converts a Blob to base64 and streams it to Gemini Live.
   *
   * ✅ FIX: Replaced asynchronous FileReader with arrayBuffer() to eliminate
   * the race condition where wsRef could become null between the readAsDataURL
   * call and the onload callback.
   */
  const sendAudioChunk = useCallback(async (blob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const buffer = await blob.arrayBuffer();
      // Re-check after the async operation completes
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        return;
      }

      const ws = wsRef.current;

      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCodePoint(bytes[i]);
      }
      const base64Data = btoa(binary);

      ws.send(
        JSON.stringify({
          realtime_input: {
            media_chunks: [
              {
                mime_type: blob.type || "audio/webm",
                data: base64Data,
              },
            ],
          },
        }),
      );
    } catch (e) {
      console.error("Failed to send audio chunk:", e);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopAudio();
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
