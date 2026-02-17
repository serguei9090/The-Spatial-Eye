"use client";

import { useCallback, useRef, useState } from "react";

import {
  buildGeminiWsUrl,
  extractCoordinateTuples,
  tupleToHighlight,
} from "@/lib/api/gemini_websocket";
import type { Highlight } from "@/lib/types";

export function useGeminiLive() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const manualCloseRef = useRef(false);

  const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    manualCloseRef.current = false;

    if (!apiKey) {
      const message = "Missing NEXT_PUBLIC_GOOGLE_API_KEY in environment.";
      setError(message);
      setErrorCode("MISSING_API_KEY");
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

    return new Promise((resolve) => {
      const ws = new WebSocket(buildGeminiWsUrl(apiKey));
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
        setIsConnecting(false);
        setIsConnected(true);
        resolve(true);
      };

      ws.onmessage = (event) => {
        const tuples = extractCoordinateTuples(String(event.data));
        if (!tuples.length) {
          return;
        }

        setActiveHighlights(tuples.map((tuple, index) => tupleToHighlight(tuple, index)));
      };

      ws.onerror = () => {
        const message = "Gemini Live connection error.";
        setError(message);
        setErrorCode("WS_ERROR");
        setErrorMessage(message);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);

        if (!manualCloseRef.current && reconnectRef.current < 4) {
          const delay = Math.min(500 * 2 ** reconnectRef.current, 5000);
          reconnectRef.current += 1;
          window.setTimeout(() => {
            void connect();
          }, delay);
        }

        resolve(false);
      };
    });
  }, []);

  const sendVideoFrame = useCallback((base64Data: string, mimeType = "image/webp") => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        realtime_input: {
          media_stream: {
            mime_type: mimeType,
            data: base64Data,
          },
        },
      }),
    );
  }, []);

  return {
    activeHighlights,
    isConnected,
    isConnecting,
    error,
    errorCode,
    errorMessage,
    connect,
    disconnect,
    sendVideoFrame,
    clearHighlights: () => setActiveHighlights([]),
  };
}
