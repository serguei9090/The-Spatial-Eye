"use client";

import { useCallback, useEffect, useState } from "react";

interface AudioDevicesState {
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
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>("");
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [outputSelectionSupported, setOutputSelectionSupported] = useState(false);

  const refreshDevices = useCallback(
    async (requestPermission = false) => {
      if (typeof window === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
        setInputDevices([]);
        setOutputDevices([]);
        setVideoDevices([]);
        return;
      }

      // ONLY request permissions if explicitly told to do so.
      // This prevents the browser from nagging the user on the landing page.
      if (requestPermission) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          for (const track of stream.getTracks()) {
            track.stop();
          }
        } catch (error) {
          console.warn("[useAudioDevices] Permission denied or no devices found:", error);
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((device) => device.kind === "audioinput");
      const outputs = devices.filter((device) => device.kind === "audiooutput");
      const videos = devices.filter((device) => device.kind === "videoinput");

      setInputDevices(inputs);
      setOutputDevices(outputs);
      setVideoDevices(videos);

      if (!selectedInputId && inputs.length > 0) {
        setSelectedInputId(inputs[0]?.deviceId ?? "");
      }

      if (!selectedOutputId && outputs.length > 0) {
        setSelectedOutputId(outputs[0]?.deviceId ?? "");
      }

      if (!selectedVideoId && videos.length > 0) {
        setSelectedVideoId(videos[0]?.deviceId ?? "");
      }
    },
    [selectedInputId, selectedOutputId, selectedVideoId],
  );

  useEffect(() => {
    // Initial enumerations WITHOUT requesting permissions
    void refreshDevices(false);
  }, [refreshDevices]);

  useEffect(() => {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.addEventListener) {
      return;
    }

    const onDeviceChange = () => {
      // Refresh but don't force a permission prompt on device change
      void refreshDevices(false);
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
    videoDevices,
    selectedInputId,
    selectedOutputId,
    selectedVideoId,
    outputSelectionSupported,
    refreshDevices: () => refreshDevices(true), // Expose a version that DOES request permissions
    setSelectedInputId,
    setSelectedOutputId,
    setSelectedVideoId,
  };
}
