"use client";

import { Mic, MicOff, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { AIOrb } from "@/components/molecules/AIOrb";
import { CoordinateDisplay } from "@/components/molecules/CoordinateDisplay";
import { ErrorToast } from "@/components/molecules/ErrorToast";
import type { Highlight } from "@/lib/types";

interface HUDPanelProps {
  isConnected: boolean;
  isListening: boolean;
  activeHighlight?: Highlight;
  error: string | null;
  onToggleListening: () => void;
}

export function HUDPanel({
  isConnected,
  isListening,
  activeHighlight,
  error,
  onToggleListening,
}: HUDPanelProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AIOrb isActive={isConnected} />
          <div>
            <h2 className="text-lg font-semibold">The Spatial Eye</h2>
            <p className="text-xs text-muted">Realtime visual grounding with Gemini Live</p>
          </div>
        </div>
        <Badge className={isConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
          {isConnected ? (
            <span className="inline-flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5" /> Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <WifiOff className="h-3.5 w-3.5" /> Offline
            </span>
          )}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onToggleListening}>
          {isListening ? (
            <span className="inline-flex items-center gap-2">
              <MicOff className="h-4 w-4" /> Stop Listening
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Mic className="h-4 w-4" /> Start Listening
            </span>
          )}
        </Button>
      </div>

      <CoordinateDisplay highlight={activeHighlight} />
      {error ? <ErrorToast message={error} /> : null}
    </section>
  );
}
