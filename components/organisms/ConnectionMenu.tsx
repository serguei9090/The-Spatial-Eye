import { KeyRound, Radio } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/Popover";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/store/settings-context";
import { cn } from "@/lib/utils";

export function ConnectionMenu() {
  const { byokKey, setByokKey } = useSettings();
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
          <KeyRound
            className={cn(
              "h-5 w-5",
              byokKey ? "text-emerald-500" : "text-amber-500",
            )}
          />
          <span className="sr-only">Connection Mode</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0 overflow-hidden"
        align="end"
        side="top"
      >
        <div className="p-4 border-b bg-muted/20">
          <h4 className="font-semibold leading-none flex items-center gap-2 text-sm">
            <Radio className="h-4 w-4 text-primary" />
            AI Connection Settings
          </h4>
        </div>

        <div className="p-4 space-y-4 bg-background">
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <KeyRound className="h-3 w-3" />
              AI Studio API Key
            </Label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={byokKey}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setByokKey(e.target.value)
              }
              className="h-9 text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Provide a custom Gemini API Key, or leave empty to use the
              server's default configuration.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
