"use client";

import { useCallback, useRef, useState } from "react";

import {
  DEFAULT_GEMINI_LIVE_MODEL,
  buildGeminiWsUrl,
  extractCoordinateTuples,
  extractTextsFromLiveServerMessage,
  tupleToHighlight,
} from "@/lib/api/gemini_websocket";
import { useAuth } from "@/lib/auth/auth-context";
import type { Highlight } from "@/lib/types";

interface EphemeralTokenResponse {
  token: string;
  expireTime?: string;
  model: string;
}

export function useGeminiLive() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const manualCloseRef = useRef(false);
  const tokenRef = useRef<EphemeralTokenResponse | null>(null);
  const { user, getIdToken } = useAuth();

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

  const mintEphemeralToken = useCallback(async (): Promise<EphemeralTokenResponse> => {
    const idToken = await getIdToken();
    if (!idToken) {
      throw new Error("Sign in required before connecting to Gemini Live.");
    }

    const configuredModel = getConfiguredModel();
    const response = await fetch("/api/gemini/ephemeral-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ model: configuredModel }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Unable to mint ephemeral Gemini token.");
    }

    const tokenPayload = (await response.json()) as EphemeralTokenResponse;
    tokenRef.current = tokenPayload;
    return tokenPayload;
  }, [getConfiguredModel, getIdToken]);

  const checkModelAvailability = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setModelAvailability("unavailable");
      return false;
    }

    try {
      setModelAvailability("checking");
      await mintEphemeralToken();
      setModelAvailability("available");
      return true;
    } catch {
      setModelAvailability("unavailable");
      return false;
    }
  }, [mintEphemeralToken, user]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    manualCloseRef.current = false;

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

    let token = tokenRef.current;
    const expiresAtMs = token?.expireTime ? new Date(token.expireTime).getTime() : 0;
    const isTokenStale =
      !token || !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now() + 10_000;

    try {
      if (isTokenStale) {
        token = await mintEphemeralToken();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to mint ephemeral token for Gemini Live.";
      setIsConnecting(false);
      setError(message);
      setErrorCode("TOKEN_MINT_FAILED");
      setErrorMessage(message);
      return false;
    }

    return new Promise((resolve) => {
      const ws = new WebSocket(buildGeminiWsUrl(token.token));
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
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
        tokenRef.current = null;

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
  }, [mintEphemeralToken, user]);

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
