import { Loader2, Mic, MicOff } from "lucide-react";

import { AIOrb } from "@/components/atoms/AIOrb";
import { CoordinateDisplay } from "@/components/molecules/CoordinateDisplay";
import { SettingsMenu } from "@/components/organisms/SettingsMenu";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/store/settings-context";
import type { Highlight } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ControlBarProps {
  readonly isConnected: boolean;
  readonly isConnecting: boolean;
  readonly isListening: boolean;
  readonly isAiTalking?: boolean;
  readonly isUserTalking?: boolean;
  readonly activeHighlight?: Highlight;
  readonly mode: "spatial" | "storyteller" | "it-architecture";
  readonly onToggleListening: () => void;
  readonly onModeChange: (mode: "spatial" | "storyteller" | "it-architecture") => void;
}

export function ControlBar({
  isConnected,
  isConnecting,
  isListening,
  isAiTalking = false,
  isUserTalking = false,
  activeHighlight,
  mode,
  onToggleListening,
  onModeChange,
}: ControlBarProps) {
  const { t } = useSettings();

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
      <div className="group flex items-center gap-2 rounded-2xl border bg-background/80 p-2 pr-3 shadow-2xl backdrop-blur-xl transition-all hover:scale-[1.01] hover:bg-background/90">
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

        {/* Unified Status Center */}
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all">
          <AIOrb
            isActive={isConnected}
            isUserTalking={isUserTalking}
            isAiTalking={isAiTalking}
            className="flex items-center justify-center p-0.5"
          />
          <div className="flex flex-col">
            <span
              className={cn(
                "text-[10px] uppercase font-bold tracking-widest leading-none mb-0.5 transition-colors",
                isConnected ? "text-emerald-400" : "text-muted-foreground",
              )}
            >
              {connectionLabel}
            </span>
            {activeHighlight ? (
              <span className="max-w-[100px] truncate font-mono text-[11px] text-primary/90 leading-none">
                {activeHighlight.objectName}
              </span>
            ) : (
              <span className="text-[11px] text-white/30 leading-none font-medium">
                {isListening ? "Listening..." : "Idle"}
              </span>
            )}
          </div>
        </div>

        <div className="ml-1 mr-1 h-8 w-px bg-border/50" />

        <div className="flex items-center gap-0.5">
          {/* Settings Menu (Popover) now handles device selection (Camera, Mic, Speaker) */}
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
