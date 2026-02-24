import {
  Camera,
  Check,
  Disc,
  Headphones,
  Languages,
  Mic,
  Settings as SettingsIcon,
  Speaker,
  Timer,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/atoms/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import { type HighlightDuration, useSettings } from "@/lib/store/settings-context";
import { cn } from "@/lib/utils";

interface SettingsMenuProps {
  mode?: "spatial" | "storyteller" | "it-architecture";
}

export function SettingsMenu({ mode }: SettingsMenuProps) {
  const {
    t,
    language,
    setLanguage,
    highlightDuration,
    setHighlightDuration,
    showDebugGrid,
    setShowDebugGrid,
  } = useSettings();

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

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full transition-all hover:bg-secondary text-white/70 hover:text-white",
            open && "bg-secondary text-secondary-foreground ring-2 ring-primary/20 text-white",
          )}
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="sr-only">Open settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 overflow-hidden" align="end" side="top">
        <div className="p-4 border-b bg-muted/20">
          <h4 className="font-semibold leading-none flex items-center gap-2 text-sm">
            <SettingsIcon className="h-4 w-4 text-primary" />
            {t.settings.title}
          </h4>
        </div>

        <div className="grid gap-0 max-h-[80vh] overflow-y-auto">
          {/* --- Media Devices Section --- */}
          <div className="p-4 space-y-4 bg-background">
            {/* Camera - Only for Visual Modes */}
            {(mode === "spatial" || mode === "storyteller") && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  <Camera className="h-3 w-3" />
                  {t.devices.camera}
                </Label>
                <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-muted/50 w-full overflow-hidden">
                    <SelectValue placeholder="Select Camera" className="truncate" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[350px]">
                    {videoDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                        <span className="truncate">
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Microphone */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <Mic className="h-3 w-3" />
                {t.devices.microphone}
              </Label>
              <Select value={selectedInputId} onValueChange={setSelectedInputId}>
                <SelectTrigger className="h-9 text-xs bg-muted/30 border-muted/50 w-full overflow-hidden">
                  <SelectValue placeholder="Select Microphone" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[350px]">
                  {inputDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                      <span className="truncate">
                        {device.label || `Microphone ${inputDevices.indexOf(device) + 1}`}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speaker (Optional) */}
            {outputSelectionSupported && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  <Speaker className="h-3 w-3" />
                  {t.devices.speaker}
                </Label>
                <Select value={selectedOutputId} onValueChange={setSelectedOutputId}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-muted/50 w-full overflow-hidden">
                    <SelectValue placeholder="Select Speaker" className="truncate" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[350px]">
                    {outputDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                        <span className="truncate">
                          {device.label || `Speaker ${outputDevices.indexOf(device) + 1}`}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* --- Application Settings --- */}
          <div className="p-4 grid gap-5 bg-muted/5">
            {/* Language */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <Languages className="h-3 w-3" />
                {t.settings.language}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={language === "en" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                  className={cn(
                    "h-8 text-xs justify-start px-3",
                    language === "en" && "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  <span className="flex-1 text-left">English</span>
                  {language === "en" && <Check className="h-3 w-3 ml-2" />}
                </Button>
                <Button
                  variant={language === "es" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("es")}
                  className={cn(
                    "h-8 text-xs justify-start px-3",
                    language === "es" && "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  <span className="flex-1 text-left">Español</span>
                  {language === "es" && <Check className="h-3 w-3 ml-2" />}
                </Button>
              </div>
            </div>

            {/* Spatial Mode Specifics */}
            {mode === "spatial" && (
              <>
                {/* Highlight Duration */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Timer className="h-3 w-3" />
                    {t.settings.highlightDuration}
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["3000", "5000", "10000", "always"] as const).map((d) => {
                      const val = d === "always" ? "always" : Number(d);
                      const isActive = highlightDuration === val;

                      let label = "";
                      if (d === "3000") label = "3s";
                      else if (d === "5000") label = "5s";
                      else if (d === "10000") label = "10s";
                      else label = "∞";

                      return (
                        <Button
                          key={d}
                          variant={isActive ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setHighlightDuration(val as HighlightDuration)}
                          className={cn(
                            "h-7 text-xs p-0",
                            isActive && "bg-primary/10 text-primary border-primary/20",
                          )}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Debug Overlay */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Disc className="h-3 w-3" />
                    Debug Overlay
                  </Label>
                  <Button
                    variant={showDebugGrid ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowDebugGrid(!showDebugGrid)}
                    className={cn(
                      "w-full h-8 text-xs justify-start px-3",
                      showDebugGrid && "bg-primary/10 text-primary border-primary/20",
                    )}
                  >
                    <span className="flex-1 text-left">
                      {showDebugGrid ? "On: Spatial Grid" : "Off: Spatial Grid"}
                    </span>
                    {showDebugGrid && <Check className="h-3 w-3 ml-2" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
