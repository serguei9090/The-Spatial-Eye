"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Next.js App Router global-error.tsx.
 * Catches errors in the root layout itself (e.g. a crash inside <Providers>).
 * No layouts or providers are available here — must be fully self-contained HTML.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[app/global-error.tsx] Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "1.5rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <AlertTriangle style={{ width: 48, height: 48, color: "#f87171" }} />
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
            Critical Error
          </h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            The application encountered a fatal error and could not recover.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.2)",
                marginTop: "0.5rem",
              }}
            >
              ID: {error.digest}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.75rem",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <RefreshCw style={{ width: 16, height: 16 }} />
          Reload application
        </button>
      </body>
    </html>
  );
}
