"use client";

import { useCallback, useEffect, useRef } from "react";

interface AudioCaptureProps {
  isActive: boolean;
  /** May be async — AudioCapture does not await the result. */
  onAudioChunk?: (blob: Blob) => void | Promise<void>;
  inputDeviceId?: string;
}

export function AudioCapture({ isActive, onAudioChunk, inputDeviceId }: AudioCaptureProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    if (recorderRef.current?.state === "recording") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: inputDeviceId
          ? { deviceId: { exact: inputDeviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
        video: false,
      });

      // Prefer PCM-compatible formats for Gemini Live. The API natively handles
      // audio/webm (opus) via server-side transcoding, but linear PCM is ideal.
      // We check support so this degrades gracefully on all browsers.
      const preferredMimeTypes = [
        "audio/webm;codecs=pcm",
        "audio/wav",
        "audio/webm;codecs=opus",
        "audio/webm",
      ];
      const mimeType = preferredMimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          onAudioChunk?.(event.data);
        }
      };

      recorder.start(100); // 100ms chunks for low latency
      recorderRef.current = recorder;
    } catch (error) {
      console.error("Failed to start audio capture:", error);
    }
  }, [inputDeviceId, onAudioChunk]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      recorder.stream.getTracks().forEach(track => track.stop());
      recorderRef.current = null;
    }
  }, []);

  // Sync recording state with isActive prop
  useEffect(() => {
    if (isActive) {
      void startRecording();
    } else {
      stopRecording();
    }
    return () => stopRecording(); // Cleanup on unmount
  }, [isActive, startRecording, stopRecording]);

  return null; // Headless component
}
