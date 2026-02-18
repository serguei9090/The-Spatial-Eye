"use client";

import { CheckCircle2, Loader2, Mic, MicOff, Wifi, WifiOff, XCircle } from "lucide-react";

import { AIOrb } from "@/components/molecules/AIOrb";
import { CoordinateDisplay } from "@/components/molecules/CoordinateDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Highlight } from "@/lib/types";

interface HUDPanelProps {
  isConnected: boolean;
  isConnecting: boolean;
  isListening: boolean;
  modelAvailability: "unknown" | "checking" | "available" | "unavailable";
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  selectedInputId: string;
  selectedOutputId: string;
  outputSelectionSupported: boolean;
  activeHighlight?: Highlight;
  onToggleListening: () => void;
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;
}

export function HUDPanel({
  isConnected,
  isConnecting,
  isListening,
  modelAvailability,
  inputDevices,
  outputDevices,
  selectedInputId,
  selectedOutputId,
  outputSelectionSupported,
  activeHighlight,
  onToggleListening,
  onInputDeviceChange,
  onOutputDeviceChange,
}: HUDPanelProps) {
  const connectionLabel = isConnecting ? "Connecting" : isConnected ? "Connected" : "Offline";

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
          <Badge variant={isConnecting || isConnected ? "secondary" : "outline"}>
            {isConnecting ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting
              </span>
            ) : isConnected ? (
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
          <Button onClick={onToggleListening} disabled={isConnecting}>
            {isListening ? (
              <span className="inline-flex items-center gap-2">
                <MicOff className="h-4 w-4" /> Stop Listening
              </span>
            ) : isConnecting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Mic className="h-4 w-4" /> Start Listening
              </span>
            )}
          </Button>
          <Badge variant="outline">{connectionLabel}</Badge>
          <Badge variant={modelAvailability === "available" ? "secondary" : "outline"}>
            {modelAvailability === "checking" ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Model check
              </span>
            ) : modelAvailability === "available" ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Model ready
              </span>
            ) : modelAvailability === "unavailable" ? (
              <span className="inline-flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-red-600" /> Model unavailable
              </span>
            ) : (
              "Model unknown"
            )}
          </Badge>
        </div>

        <CoordinateDisplay highlight={activeHighlight} />

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="audio-input-select">Audio input</Label>
            <Select value={selectedInputId} onValueChange={onInputDeviceChange}>
              <SelectTrigger id="audio-input-select" className="w-full">
                <SelectValue placeholder="Select microphone" className="truncate" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {inputDevices.length === 0 ? (
                  <SelectItem value="no-input" disabled>
                    No input devices found
                  </SelectItem>
                ) : (
                  inputDevices.map((device, index) => {
                    const label = device.label || `Microphone ${index + 1}`;
                    return (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        <span className="block max-w-[26rem] truncate" title={label}>
                          {label}
                        </span>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="audio-output-select">Audio output</Label>
            <Select
              value={selectedOutputId}
              onValueChange={onOutputDeviceChange}
              disabled={!outputSelectionSupported}
            >
              <SelectTrigger id="audio-output-select" className="w-full">
                <SelectValue
                  className="truncate"
                  placeholder={
                    outputSelectionSupported
                      ? "Select speaker/headset"
                      : "Output switching unsupported in this browser"
                  }
                />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {outputDevices.length === 0 ? (
                  <SelectItem value="no-output" disabled>
                    No output devices found
                  </SelectItem>
                ) : (
                  outputDevices.map((device, index) => {
                    const label = device.label || `Output ${index + 1}`;
                    return (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        <span className="block max-w-[26rem] truncate" title={label}>
                          {label}
                        </span>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {!outputSelectionSupported ? (
              <p className="text-xs text-muted-foreground">
                Speaker selection requires browser support for `setSinkId`.
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
