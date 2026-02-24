import { Camera, Loader2, Mic, MicOff, Speaker } from "lucide-react";

import { AIOrb } from "@/components/atoms/AIOrb";
import { CoordinateDisplay } from "@/components/molecules/CoordinateDisplay";
import { DeviceSelector } from "@/components/molecules/DeviceSelector";
import { SettingsMenu } from "@/components/organisms/SettingsMenu";
import { Button } from "@/components/ui/button";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import { useSettings } from "@/lib/store/settings-context";
import type { Highlight } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ControlBarProps {
  readonly isConnected: boolean;
  readonly isConnecting: boolean;
  readonly isListening: boolean;
  readonly activeHighlight?: Highlight;
  readonly mode: "spatial" | "storyteller" | "it-architecture";
  readonly onToggleListening: () => void;
  readonly onModeChange: (mode: "spatial" | "storyteller" | "it-architecture") => void;
}

export function ControlBar({
  isConnected,
  isConnecting,
  isListening,
  activeHighlight,
  mode,
  onToggleListening,
  onModeChange,
}: ControlBarProps) {
  const { t } = useSettings();
  const {
    inputDevices,
    outputDevices,
    videoDevices,
    selectedInputId,
    selectedOutputId,
    selectedVideoId,
    outputSelectionSupported,
    setSelectedInputId,
    setSelectedOutputId,
    setSelectedVideoId,
  } = useAudioDeviceContext();

  const connectionLabel = isConnecting
    ? t.status.connecting
    : isConnected
      ? t.status.live
      : t.status.ready;

  const renderMicIcon = () => {
    if (isConnecting) return <Loader2 className="h-6 w-6 animate-spin" />;
    if (isListening) return <MicOff className="h-6 w-6" />;
    return <Mic className="h-6 w-6" />;
  };

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

      {/* Mode Selector */}
      <div className="flex items-center gap-1 rounded-xl border bg-background/50 p-1 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onModeChange("spatial")}
          className={cn(
            "h-8 rounded-lg px-3 text-xs font-medium transition-all hover:bg-white/10",
            mode === "spatial" && "bg-primary/20 text-primary hover:bg-primary/30",
          )}
        >
          {t.modes.live}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onModeChange("storyteller")}
          className={cn(
            "h-8 rounded-lg px-3 text-xs font-medium transition-all hover:bg-white/10",
            mode === "storyteller" && "bg-primary/20 text-primary hover:bg-primary/30",
          )}
        >
          {t.modes.storyteller}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onModeChange("it-architecture")}
          className={cn(
            "h-8 rounded-lg px-3 text-xs font-medium transition-all hover:bg-white/10",
            mode === "it-architecture" && "bg-primary/20 text-primary hover:bg-primary/30",
          )}
        >
          {t.modes.itArchitecture}
        </Button>
      </div>

      {/* Main Dock / Control Bar */}
      <div className="group flex items-center gap-3 rounded-2xl border bg-background/80 p-3 shadow-2xl backdrop-blur-xl transition-all hover:scale-[1.01] hover:bg-background/90">
        {/* Connection Toggle (Primary Action) */}
        <Button
          type="button"
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
          {renderMicIcon()}
          <span className="hidden text-base font-semibold sm:inline-block sm:ml-2">
            {isListening ? t.controls.end : t.controls.start}
          </span>
        </Button>

        <div className="mx-1 h-8 w-px bg-border/50" />

        <div className="flex items-center gap-1">
          <DeviceSelector
            icon={Camera}
            label={t.devices.camera}
            devices={videoDevices}
            selectedId={selectedVideoId}
            onDeviceChange={setSelectedVideoId}
          />

          <DeviceSelector
            icon={Mic}
            label={t.devices.microphone}
            devices={inputDevices}
            selectedId={selectedInputId}
            onDeviceChange={setSelectedInputId}
          />

          <DeviceSelector
            icon={Speaker}
            label={t.devices.speaker}
            devices={outputDevices}
            selectedId={selectedOutputId}
            onDeviceChange={setSelectedOutputId}
            disabled={!outputSelectionSupported}
          />

          <div className="mx-1 h-8 w-px bg-border/50" />

          {/* Settings Menu (Popover) */}
          <SettingsMenu mode={mode} />
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
