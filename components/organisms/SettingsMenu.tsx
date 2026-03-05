import {
  Camera,
  Check,
  Disc,
  Download,
  Languages,
  MessageSquare,
  Mic,
  Settings as SettingsIcon,
  Speaker,
  Timer,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import {
  type HighlightDuration,
  type HighlightType,
  useSettings,
} from "@/lib/store/settings-context";
import { cn } from "@/lib/utils";

interface SettingsMenuProps {
  readonly mode?: "spatial" | "storyteller" | "it-architecture";
  readonly onDownload?: () => void;
  readonly onUpload?: (file: File) => void;
}

export function SettingsMenu({
  mode,
  onDownload,
  onUpload,
}: SettingsMenuProps) {
  const {
    t,
    language,
    setLanguage,
    highlightDuration,
    setHighlightDuration,
    highlightType,
    setHighlightType,
    showDebugGrid,
    setShowDebugGrid,
    isDiagnosticsEnabled,
    showTranscript,
    setShowTranscript,
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
            "h-10 w-10 rounded-full transition-all hover:bg-secondary text-muted-foreground hover:text-foreground",
            open && "bg-secondary text-foreground ring-2 ring-primary/20",
          )}
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="sr-only">Open settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 overflow-hidden"
        align="end"
        side="top"
      >
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
                <Select
                  value={selectedVideoId}
                  onValueChange={setSelectedVideoId}
                >
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-muted/50 w-full overflow-hidden">
                    <SelectValue
                      placeholder="Select Camera"
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent className="max-w-[350px]">
                    {videoDevices.map((device) => (
                      <SelectItem
                        key={device.deviceId}
                        value={device.deviceId}
                        className="text-xs"
                      >
                        <span className="truncate">
                          {device.label ||
                            `Camera ${videoDevices.indexOf(device) + 1}`}
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
              <Select
                value={selectedInputId}
                onValueChange={setSelectedInputId}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/30 border-muted/50 w-full overflow-hidden">
                  <SelectValue
                    placeholder="Select Microphone"
                    className="truncate"
                  />
                </SelectTrigger>
                <SelectContent className="max-w-[350px]">
                  {inputDevices.map((device) => (
                    <SelectItem
                      key={device.deviceId}
                      value={device.deviceId}
                      className="text-xs"
                    >
                      <span className="truncate">
                        {device.label ||
                          `Microphone ${inputDevices.indexOf(device) + 1}`}
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
                <Select
                  value={selectedOutputId}
                  onValueChange={setSelectedOutputId}
                >
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-muted/50 w-full overflow-hidden">
                    <SelectValue
                      placeholder="Select Speaker"
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent className="max-w-[350px]">
                    {outputDevices.map((device) => (
                      <SelectItem
                        key={device.deviceId}
                        value={device.deviceId}
                        className="text-xs"
                      >
                        <span className="truncate">
                          {device.label ||
                            `Speaker ${outputDevices.indexOf(device) + 1}`}
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
            {/* Architecture Actions */}
            {mode === "it-architecture" && (
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  <Download className="h-3 w-3" />
                  Diagram Actions
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                    className="h-9 text-xs flex items-center justify-center gap-2 bg-muted/30 border-muted/50 transition-all hover:bg-primary/10 hover:border-primary/30"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export JSON
                  </Button>
                  <label className="cursor-pointer">
                    <div className="h-9 w-full rounded-md border border-muted/50 bg-muted/30 px-3 py-1 text-xs flex items-center justify-center gap-2 transition-all hover:bg-primary/10 hover:border-primary/30">
                      <Upload className="h-3.5 w-3.5" />
                      Import JSON
                    </div>
                    <input
                      type="file"
                      id="diagram-upload"
                      className="hidden"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onUpload) {
                          onUpload(file);
                          // Clear input so same file can be uploaded again if modified
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

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
                    language === "en" &&
                      "bg-primary/10 text-primary border-primary/20",
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
                    language === "es" &&
                      "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  <span className="flex-1 text-left">Español</span>
                  {language === "es" && <Check className="h-3 w-3 ml-2" />}
                </Button>
              </div>
            </div>

            {/* AI Transcript - Available for both mode dimensions except storyteller */}
            {(mode === "spatial" || mode === "it-architecture") && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  <MessageSquare className="h-3 w-3" />
                  AI Transcript
                </Label>
                <Button
                  variant={showTranscript ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={cn(
                    "w-full h-8 text-xs justify-start px-3",
                    showTranscript &&
                      "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  <span className="flex-1 text-left">
                    {showTranscript
                      ? "On: AI Transcript"
                      : "Off: AI Transcript"}
                  </span>
                  {showTranscript && <Check className="h-3 w-3 ml-2" />}
                </Button>
              </div>
            )}

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
                          onClick={() =>
                            setHighlightDuration(val as HighlightDuration)
                          }
                          className={cn(
                            "h-7 text-xs p-0",
                            isActive &&
                              "bg-primary/10 text-primary border-primary/20",
                          )}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Highlight Type */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Disc className="h-3 w-3" />
                    {/* @ts-ignore - added to translations */}
                    {t.settings.highlightType}
                  </Label>
                  <Select
                    value={highlightType}
                    onValueChange={(val) =>
                      setHighlightType(val as HighlightType)
                    }
                  >
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-muted/50 w-full overflow-hidden">
                      <SelectValue placeholder="Select Shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle" className="text-xs">
                        {/* @ts-ignore - added to translations */}
                        {t.settings.types.circle}
                      </SelectItem>
                      <SelectItem value="rounded-rect" className="text-xs">
                        {/* @ts-ignore - added to translations */}
                        {t.settings.types.rect}
                      </SelectItem>
                      <SelectItem value="fitted-circle" className="text-xs">
                        {/* @ts-ignore - added to translations */}
                        {t.settings.types.fitted}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Debug Overlay - Only available in diagnostics mode */}
                {isDiagnosticsEnabled && (
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
                        showDebugGrid &&
                          "bg-primary/10 text-primary border-primary/20",
                      )}
                    >
                      <span className="flex-1 text-left">
                        {showDebugGrid
                          ? "On: Spatial Grid"
                          : "Off: Spatial Grid"}
                      </span>
                      {showDebugGrid && <Check className="h-3 w-3 ml-2" />}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
