"use client";

import { Camera, Loader2, Mic, MicOff, Speaker } from "lucide-react";

import { AIOrb } from "@/components/atoms/AIOrb";
import { CoordinateDisplay } from "@/components/molecules/CoordinateDisplay";
import { DeviceSelector } from "@/components/molecules/DeviceSelector";
import { Button } from "@/components/ui/button";
import type { Highlight } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ControlBarProps {
  isConnected: boolean;
  isConnecting: boolean;
  isListening: boolean;
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedInputId: string;
  selectedOutputId: string;
  selectedVideoId: string;
  outputSelectionSupported: boolean;
  activeHighlight?: Highlight;
  onToggleListening: () => void;
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  onVideoDeviceChange: (deviceId: string) => void;
}

export function ControlBar({
  isConnected,
  isConnecting,
  isListening,
  inputDevices,
  outputDevices,
  videoDevices,
  selectedInputId,
  selectedOutputId,
  selectedVideoId,
  outputSelectionSupported,
  activeHighlight,
  onToggleListening,
  onInputDeviceChange,
  onOutputDeviceChange,
  onVideoDeviceChange,
}: ControlBarProps) {
  const connectionLabel = isConnecting ? "Connecting..." : isConnected ? "Live" : "Ready";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Top Status Bar (Mobile Friendly) */}
      <div className="flex items-center gap-3 rounded-full bg-background/60 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-md transition-all">
        <AIOrb isActive={isConnected} className="flex items-center justify-center p-0.5" />
        <span
          className={cn(
            "transition-colors",
            isConnected ? "text-emerald-400" : "text-muted-foreground",
          )}
        >
          {connectionLabel}
        </span>
        {activeHighlight && (
          <>
            <div className="h-4 w-px bg-border/50" />
            <span className="max-w-[120px] truncate font-mono text-xs text-primary/80">
              {activeHighlight.objectName}
            </span>
          </>
        )}
      </div>

      {/* Main Dock / Control Bar */}
      <div className="group flex items-center gap-3 rounded-2xl border bg-background/80 p-3 shadow-2xl backdrop-blur-xl transition-all hover:scale-[1.01] hover:bg-background/90">
        {/* Connection Toggle (Primary Action) */}
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className={cn(
            "h-12 w-12 rounded-xl shadow-md transition-all sm:w-auto sm:px-6",
            isListening && "animate-pulse ring-4 ring-destructive/20",
          )}
          onClick={() => {
            console.log("[ControlBar] Toggle button clicked");
            onToggleListening();
          }}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
          <span className="hidden text-base font-semibold sm:inline-block sm:ml-2">
            {isListening ? "End Session" : "Start Session"}
          </span>
        </Button>

        <div className="mx-1 h-8 w-px bg-border/50" />

        <div className="flex items-center gap-1">
          <DeviceSelector
            icon={Camera}
            label="Camera"
            devices={videoDevices}
            selectedId={selectedVideoId}
            onDeviceChange={onVideoDeviceChange}
          />

          <DeviceSelector
            icon={Mic}
            label="Microphone"
            devices={inputDevices}
            selectedId={selectedInputId}
            onDeviceChange={onInputDeviceChange}
          />

          <DeviceSelector
            icon={Speaker}
            label="Speaker"
            devices={outputDevices}
            selectedId={selectedOutputId}
            onDeviceChange={onOutputDeviceChange}
            disabled={!outputSelectionSupported}
          />
        </div>
      </div>

      {/* Floating Coordinate Display (Mobile) or Detailed Status (Desktop) */}
      {activeHighlight && (
        <div className="mt-2 block sm:hidden">
          <CoordinateDisplay highlight={activeHighlight} />
        </div>
      )}
    </div>
  );
}
