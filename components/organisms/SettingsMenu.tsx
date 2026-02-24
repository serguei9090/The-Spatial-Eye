"use client";

import { Check, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/atoms/Popover";
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
      <PopoverContent className="w-80 p-4" align="end" side="top">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-medium leading-none">{t.settings.title}</h4>
        </div>

        <div className="grid gap-6">
          {/* Language Setting */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t.settings.language}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={language === "en" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                className={cn(
                  "justify-start",
                  language === "en" &&
                    "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
                )}
              >
                <span className="flex-1 text-left">English</span>
                {language === "en" && <Check className="h-3.5 w-3.5 ml-2" />}
              </Button>
              <Button
                variant={language === "es" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setLanguage("es")}
                className={cn(
                  "justify-start",
                  language === "es" &&
                    "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
                )}
              >
                <span className="flex-1 text-left">Español</span>
                {language === "es" && <Check className="h-3.5 w-3.5 ml-2" />}
              </Button>
            </div>
          </div>

          {/* Highlight Duration Setting */}
          {mode === "spatial" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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

                  let titleText = "";
                  if (d === "3000") titleText = t.settings.durations.short;
                  else if (d === "5000") titleText = t.settings.durations.medium;
                  else if (d === "10000") titleText = t.settings.durations.long;
                  else titleText = t.settings.durations.always;

                  return (
                    <Button
                      key={d}
                      variant={isActive ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setHighlightDuration(val as HighlightDuration)}
                      className={cn(
                        isActive &&
                          "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
                      )}
                      title={titleText}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Debug Grid Setting */}
          {mode === "spatial" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Debug Overlay
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={showDebugGrid ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowDebugGrid(!showDebugGrid)}
                  className={cn(
                    "flex-1",
                    showDebugGrid &&
                      "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
                  )}
                >
                  {showDebugGrid ? "Hide Spatial Grid" : "Show Spatial Grid"}
                  {showDebugGrid && <Check className="h-3.5 w-3.5 ml-2" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
