"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface AIErrorBoundaryProps {
  readonly children: ReactNode;
  /** Optional custom fallback UI */
  readonly fallback?: ReactNode;
  /** Optional error callback for external logging */
  readonly onError?: (error: Error, info: ErrorInfo) => void;
  /** Label shown in the default fallback (e.g. "Creative Studio") */
  readonly label?: string;
}

interface AIErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

/**
 * Isolates AI organism crashes so the rest of the UI (ControlBar, navigation)
 * stays functional when a WebSocket, ReactFlow, or framer-motion error occurs.
 *
 * Use the `key` prop on the parent to reset the boundary when context changes:
 * <AIErrorBoundary key={mode}>...</AIErrorBoundary>
 */
export class AIErrorBoundary extends Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
  constructor(props: AIErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AIErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[AIErrorBoundary] Caught render error:", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/20">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-red-100">
              {this.props.label ? `${this.props.label} crashed` : "Something went wrong"}
            </p>
            <p className="max-w-xs text-xs text-red-300/60 font-mono">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-all hover:bg-red-500/20 hover:text-red-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
