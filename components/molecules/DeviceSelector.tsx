"use client";

import { Check, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DeviceSelectorProps {
  icon: LucideIcon;
  label: string;
  devices: MediaDeviceInfo[];
  selectedId: string;
  onDeviceChange: (deviceId: string) => void;
  disabled?: boolean;
}

export function DeviceSelector({
  icon: Icon,
  label,
  devices,
  selectedId,
  onDeviceChange,
  disabled,
}: DeviceSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={cn(
            "h-10 w-10 rounded-full transition-all hover:bg-secondary",
            open && "bg-secondary text-secondary-foreground ring-2 ring-primary/20",
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="sr-only">Select {label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="center" side="top">
        <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">{label}</div>
        <div className="flex flex-col gap-1">
          {devices.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No devices found</div>
          ) : (
            devices.map((device, index) => (
              <button
                type="button"
                key={device.deviceId}
                onClick={() => {
                  onDeviceChange(device.deviceId);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary",
                  device.deviceId === selectedId && "bg-secondary/50 font-medium",
                )}
              >
                <span className="truncate">{device.label || `${label} ${index + 1}`}</span>
                {device.deviceId === selectedId && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
