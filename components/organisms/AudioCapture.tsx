"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface AudioCaptureProps {
  onAudioChunk?: (blob: Blob) => void;
  inputDeviceId?: string;
}

export function AudioCapture({ onAudioChunk, inputDeviceId }: AudioCaptureProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: inputDeviceId ? { deviceId: { exact: inputDeviceId } } : true,
      video: false,
    });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        onAudioChunk?.(event.data);
      }
    };

    recorder.start(1000);
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [inputDeviceId, isRecording, onAudioChunk]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return;
    }

    recorder.stop();
    for (const track of recorder.stream.getTracks()) {
      track.stop();
    }
    recorderRef.current = null;
    setIsRecording(false);
  }, []);

  return isRecording ? (
    <Button variant="outline" onClick={stopRecording}>
      Stop Mic
    </Button>
  ) : (
    <Button variant="outline" onClick={() => void startRecording()}>
      Start Mic
    </Button>
  );
}
