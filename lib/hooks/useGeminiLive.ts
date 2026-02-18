"use client";

import { useCallback, useRef, useState } from "react";

import {
  DEFAULT_GEMINI_LIVE_MODEL,
  SPATIAL_SYSTEM_INSTRUCTION,
  buildGeminiWsUrl,
  extractCoordinateTuples,
  extractTextsFromLiveServerMessage,
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
  const [modelAvailability, setModelAvailability] = useState<
    "unknown" | "checking" | "available" | "unavailable"
  >("unknown");

  const getConfiguredModel = useCallback(
    () => process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL?.trim() || DEFAULT_GEMINI_LIVE_MODEL,
    [],
  );

  const checkModelAvailability = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const configuredModel = getConfiguredModel().replace(/^models\//, "");

    if (!apiKey) {
      setModelAvailability("unavailable");
      return false;
    }

    try {
      setModelAvailability("checking");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${configuredModel}?key=${apiKey}`,
        { method: "GET" },
      );

      if (!response.ok) {
        setModelAvailability("unavailable");
        return false;
      }

      const modelInfo = (await response.json()) as {
        supportedGenerationMethods?: string[];
      };

      const supportsLive =
        modelInfo.supportedGenerationMethods?.includes("bidiGenerateContent") ?? false;
      if (!supportsLive) {
        setModelAvailability("unavailable");
        const message = `Model "${configuredModel}" does not support Live API (bidiGenerateContent).`;
        setError(message);
        setErrorCode("MODEL_NOT_LIVE");
        setErrorMessage(message);
        return false;
      }

      setModelAvailability("available");
      return true;
    } catch {
      setModelAvailability("unavailable");
      return false;
    }
  }, [getConfiguredModel]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const configuredModel = getConfiguredModel();
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

    const modelAvailable = await checkModelAvailability();
    if (!modelAvailable) {
      const message = `Configured live model "${configuredModel}" is not available for this API key.`;
      setError(message);
      setErrorCode("MODEL_UNAVAILABLE");
      setErrorMessage(message);
      return false;
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
        ws.send(
          JSON.stringify({
            setup: {
              model: `models/${configuredModel}`,
              generationConfig: {
                responseModalities: ["TEXT"],
              },
              systemInstruction: {
                parts: [{ text: SPATIAL_SYSTEM_INSTRUCTION }],
              },
            },
          }),
        );
        setIsConnecting(false);
        setIsConnected(true);
        resolve(true);
      };

      ws.onmessage = (event) => {
        const responseText = extractTextsFromLiveServerMessage(String(event.data)).join("\n");
        const tuples = extractCoordinateTuples(responseText);
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

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);

        const shouldRetry =
          !manualCloseRef.current &&
          reconnectRef.current < 4 &&
          ![1002, 1003, 1007, 1008].includes(event.code);

        if (shouldRetry) {
          const delay = Math.min(500 * 2 ** reconnectRef.current, 5000);
          reconnectRef.current += 1;
          window.setTimeout(() => {
            void connect();
          }, delay);
        }

        resolve(false);
      };
    });
  }, [checkModelAvailability, getConfiguredModel]);

  const sendVideoFrame = useCallback((base64Data: string, mimeType = "image/webp") => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        realtimeInput: {
          video: {
            mimeType,
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
    modelAvailability,
    checkModelAvailability,
    connect,
    disconnect,
    sendVideoFrame,
    clearHighlights: () => setActiveHighlights([]),
  };
}
