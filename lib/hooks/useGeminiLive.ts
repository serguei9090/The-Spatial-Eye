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

  const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!apiKey) {
      setError("Missing NEXT_PUBLIC_GOOGLE_API_KEY in environment.");
      return false;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsConnected(true);
      return true;
    }

    setIsConnecting(true);
    setError(null);

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
        setError("Gemini Live connection error.");
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);

        if (reconnectRef.current < 4) {
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
    connect,
    disconnect,
    sendVideoFrame,
    clearHighlights: () => setActiveHighlights([]),
  };
}
