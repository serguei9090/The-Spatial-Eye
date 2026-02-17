"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface AudioCaptureProps {
  onAudioChunk?: (blob: Blob) => void;
}

export function AudioCapture({ onAudioChunk }: AudioCaptureProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        onAudioChunk?.(event.data);
      }
    };

    recorder.start(1000);
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [isRecording, onAudioChunk]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return;
    }

    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
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
