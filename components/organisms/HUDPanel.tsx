"use client";

import { Mic, MicOff, Wifi, WifiOff } from "lucide-react";

import { AIOrb } from "@/components/molecules/AIOrb";
import { CoordinateDisplay } from "@/components/molecules/CoordinateDisplay";
import { ErrorToast } from "@/components/molecules/ErrorToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AIOrb isActive={isConnected} />
            <div>
              <CardTitle>The Spatial Eye</CardTitle>
              <CardDescription>Realtime visual grounding with Gemini Live</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "secondary" : "outline"}>
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
      </CardHeader>

      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
