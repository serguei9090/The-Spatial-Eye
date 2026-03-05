"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Next.js App Router client-side error boundary.
 * Shown when an error bubbles past all React boundaries inside a route segment.
 * The `reset()` function re-renders the segment from scratch.
 */
export default function RouteError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[app/error.tsx] Route segment error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-black p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-950/30">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Something went wrong</h1>
        <p className="max-w-md text-sm text-white/50">
          The Spatial Eye encountered an unexpected error. Your session data has not been lost.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-white/20">Error ID: {error.digest}</p>
        )}
      </div>

      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:scale-105"
      >
        <RefreshCw className="h-4 w-4" />
        Reset and try again
      </button>
    </div>
  );
}
