import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";

import { AIOrb } from "@/components/atoms/AIOrb";
import { CoordinateDisplay } from "@/components/molecules/CoordinateDisplay";
import { ConnectionMenu } from "@/components/organisms/ConnectionMenu";
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
  readonly modelAvailability?: "unknown" | "checking" | "available" | "unavailable";
  readonly onToggleListening: () => void;
  readonly onModeChange: (mode: "spatial" | "storyteller" | "it-architecture") => void;
  readonly onDownload?: () => void;
  readonly onUpload?: (file: File) => void;
}

export function ControlBar({
  isConnected,
  isConnecting,
  isListening,
  isAiTalking = false,
  isUserTalking = false,
  activeHighlight,
  mode,
  modelAvailability = "unknown",
  onToggleListening,
  onModeChange,
  onDownload,
  onUpload,
}: ControlBarProps) {
  const { t } = useSettings();
  const [showHelp, setShowHelp] = useState(false);

  const isKeyUnavailable = modelAvailability === "unavailable";
  const isStartDisabled = isConnecting || isKeyUnavailable;

  useEffect(() => {
    // Show help bubble when connected and listening
    if (isConnected && isListening) {
      setShowHelp(true);
      // Auto-hide after 5 seconds
      const timeout = setTimeout(() => {
        setShowHelp(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    setShowHelp(false);
  }, [isConnected, isListening]);

  // Also hide if user starts speaking
  useEffect(() => {
    if (isUserTalking && showHelp) {
      setShowHelp(false);
    }
  }, [isUserTalking, showHelp]);

  let connectionLabel = t.status.ready;
  if (isConnecting) {
    connectionLabel = t.status.connecting;
  } else if (isConnected) {
    connectionLabel = t.status.live;
  }

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
            "h-8 rounded-lg px-3 text-xs font-medium transition-all hover:bg-accent",
            mode === "spatial" && "bg-primary/20 text-primary hover:bg-primary/30",
          )}
        >
          {t.modes.live}
        </Button>
        {/* Storyteller Mode Hidden for Hakentoch Focus 
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onModeChange("storyteller")}
          className={cn(
            "h-8 rounded-lg px-3 text-xs font-medium transition-all hover:bg-accent",
            mode === "storyteller" && "bg-primary/20 text-primary hover:bg-primary/30",
          )}
        >
          {t.modes.storyteller}
        </Button>
        */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onModeChange("it-architecture")}
          className={cn(
            "h-8 rounded-lg px-3 text-xs font-medium transition-all hover:bg-accent",
            mode === "it-architecture" && "bg-primary/20 text-primary hover:bg-primary/30",
          )}
        >
          {t.modes.itArchitecture}
        </Button>
      </div>

      {/* Main Dock / Control Bar */}
      <div className="group flex items-center gap-2 rounded-2xl border bg-background/80 p-2 pr-3 shadow-2xl backdrop-blur-xl transition-all hover:scale-[1.01] hover:bg-background/90">
        {/* Connection Toggle (Primary Action) */}
        <div className="relative">
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="pointer-events-none absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-primary"
              >
                Say "Hi" or "Hello" 👋
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="button"
            size="lg"
            variant={isListening ? "destructive" : "default"}
            className={cn(
              "h-12 w-auto min-w-[3rem] px-3 rounded-xl shadow-md transition-all sm:px-6",
              isListening && !isConnecting && "animate-pulse ring-4 ring-destructive/20",
              isConnecting && "opacity-80 cursor-wait bg-muted text-muted-foreground",
              isKeyUnavailable && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => {
              onToggleListening();
            }}
            disabled={isStartDisabled}
            title={
              isKeyUnavailable ? "No API key configured — use the 🔑 icon to set one" : undefined
            }
          >
            {renderMicIcon()}
            <span className="inline-block flex-shrink-0 ml-1.5 text-xs font-semibold sm:text-base sm:ml-2">
              {isConnecting
                ? t.status.connecting
                : isListening
                  ? t.controls.stop
                  : t.controls.start}
            </span>
          </Button>
        </div>

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
              <span className="text-[11px] text-muted-foreground/60 leading-none font-medium">
                {isListening ? "Listening..." : "Idle"}
              </span>
            )}
          </div>
        </div>

        <div className="ml-1 mr-1 h-8 w-px bg-border/50" />

        <div className="flex items-center gap-0.5">
          {/* Settings Menu (Popover) now handles device selection (Camera, Mic, Speaker) */}
          <ConnectionMenu />
          <SettingsMenu mode={mode} onDownload={onDownload} onUpload={onUpload} />
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
