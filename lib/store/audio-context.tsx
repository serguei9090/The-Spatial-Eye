"use client";

import { useAudioDevices } from "@/lib/hooks/useAudioDevices";
import { type ReactNode, createContext, useContext } from "react";

interface AudioDeviceContextType {
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedInputId: string;
  selectedOutputId: string;
  selectedVideoId: string;
  outputSelectionSupported: boolean;
  refreshDevices: () => Promise<void>;
  setSelectedInputId: (deviceId: string) => void;
  setSelectedOutputId: (deviceId: string) => void;
  setSelectedVideoId: (deviceId: string) => void;
}

const AudioDeviceContext = createContext<AudioDeviceContextType | undefined>(undefined);

export function AudioDeviceProvider({ children }: { children: ReactNode }) {
  const devices = useAudioDevices();
  return <AudioDeviceContext.Provider value={devices}>{children}</AudioDeviceContext.Provider>;
}

export function useAudioDeviceContext() {
  const context = useContext(AudioDeviceContext);
  if (context === undefined) {
    throw new Error("useAudioDeviceContext must be used within an AudioDeviceProvider");
  }
  return context;
}
