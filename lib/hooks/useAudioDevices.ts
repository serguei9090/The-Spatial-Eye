"use client";

import { useCallback, useEffect, useState } from "react";

interface AudioDevicesState {
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  selectedInputId: string;
  selectedOutputId: string;
  outputSelectionSupported: boolean;
  refreshDevices: () => Promise<void>;
  setSelectedInputId: (deviceId: string) => void;
  setSelectedOutputId: (deviceId: string) => void;
}

function supportsSinkIdSelection(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    typeof (HTMLMediaElement.prototype as HTMLMediaElement & { setSinkId?: unknown }).setSinkId ===
    "function"
  );
}

export function useAudioDevices(): AudioDevicesState {
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>("");
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");
  const [outputSelectionSupported, setOutputSelectionSupported] = useState(false);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setInputDevices([]);
      setOutputDevices([]);
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((device) => device.kind === "audioinput");
    const outputs = devices.filter((device) => device.kind === "audiooutput");

    setInputDevices(inputs);
    setOutputDevices(outputs);

    if (!selectedInputId && inputs.length > 0) {
      setSelectedInputId(inputs[0]?.deviceId ?? "");
    }

    if (!selectedOutputId && outputs.length > 0) {
      setSelectedOutputId(outputs[0]?.deviceId ?? "");
    }
  }, [selectedInputId, selectedOutputId]);

  useEffect(() => {
    void refreshDevices();
  }, [refreshDevices]);

  useEffect(() => {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.addEventListener) {
      return;
    }

    const onDeviceChange = () => {
      void refreshDevices();
    };

    mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => mediaDevices.removeEventListener("devicechange", onDeviceChange);
  }, [refreshDevices]);

  useEffect(() => {
    setOutputSelectionSupported(supportsSinkIdSelection());
  }, []);

  return {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    outputSelectionSupported,
    refreshDevices,
    setSelectedInputId,
    setSelectedOutputId,
  };
}
