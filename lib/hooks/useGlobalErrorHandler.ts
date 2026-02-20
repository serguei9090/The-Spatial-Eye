"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { extractModelId, isModelApiError, notifyModelError } from "@/lib/gemini/model-error";

/**
 * Mounts window-level error listeners to catch:
 * - Unhandled JS errors (window.onerror)
 * - Unhandled promise rejections (WebSocket closes, API failures)
 *
 * Routes them to a sonner toast without re-throwing, keeping the app alive.
 *
 * Google / Gemini model errors (billing, quota, rate limit, not found) are
 * routed through notifyModelError so they always show the model's friendly
 * display name. This covers any callsite that lacks an explicit try/catch.
 *
 * Mount once — inside Providers via <GlobalErrorListener />.
 */
export function useGlobalErrorHandler(): void {
  useEffect(() => {
    const handleError = (event: ErrorEvent): void => {
      console.error("[GlobalErrorHandler] Unhandled error:", event.error);

      // Ignore React internal errors already caught by Error Boundaries
      if (event.error?.name === "ChunkLoadError") {
        toast.error("A module failed to load. Try refreshing the page.", {
          id: "chunk-load-error",
          duration: 8000,
        });
        return;
      }

      toast.error(event.error?.message ?? "An unexpected error occurred", {
        description: event.filename ? `${event.filename}:${event.lineno}` : undefined,
        duration: 6000,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      event.preventDefault(); // Suppress browser console warning

      const reason = event.reason as unknown;
      let message: string;
      if (reason instanceof Error) {
        message = reason.message;
      } else if (typeof reason === "string") {
        message = reason;
      } else {
        message = "An unhandled error occurred";
      }

      // ── Google / Gemini API model errors ──────────────────────────────────
      // Route through the shared utility so the friendly model name shows up.
      if (isModelApiError(reason)) {
        // Try to find which model errored from the message text.
        // Falls back to "gemini-api" so the toast still shows a useful label.
        const modelId = extractModelId(message) ?? "gemini-api";
        notifyModelError(modelId, reason);
        return;
      }

      // ── WebSocket / connection errors ─────────────────────────────────────
      const isWebSocketError =
        message.includes("WebSocket") ||
        message.includes("1007") ||
        message.includes("1006") ||
        message.includes("INVALID_ARGUMENT");

      if (isWebSocketError) {
        toast.error("Connection error", {
          description: message,
          id: "websocket-error",
          duration: 7000,
        });
        return;
      }

      // ── Generic fallback ──────────────────────────────────────────────────
      console.error("[GlobalErrorHandler] Unhandled rejection:", reason);
      toast.error(message, { duration: 5000 });
    };

    globalThis.addEventListener("error", handleError);
    globalThis.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      globalThis.removeEventListener("error", handleError);
      globalThis.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}
