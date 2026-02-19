"use client";

import { pcmFloat32ToInt16 } from "@/lib/utils/audio";
import { useCallback, useEffect, useRef } from "react";

interface AudioCaptureProps {
  isActive: boolean;
  /**
   * Emits raw 16-bit PCM samples at 16000Hz (mono).
   * The Gemini Live API requires: 16-bit PCM, 16kHz, mono.
   * Reference: https://ai.google.dev/gemini-api/docs/live
   */
  onAudioChunk?: (data: Int16Array) => void;
  inputDeviceId?: string;
}

export function AudioCapture({ isActive, onAudioChunk, inputDeviceId }: AudioCaptureProps) {
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startRecording = useCallback(async () => {
    if (audioContextRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: inputDeviceId
          ? { deviceId: { exact: inputDeviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      streamRef.current = stream;

      // CRITICAL: Gemini Live API requires 16kHz PCM input.
      // The model outputs audio at 24kHz, but INPUT must be 16kHz.
      // Source: https://ai.google.dev/gemini-api/docs/live
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Load the AudioWorklet and connect the pipeline
      await audioContext.audioWorklet.addModule("/worklets/pcm-capture-processor.js");

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, "pcm-capture-processor");
      workletNodeRef.current = workletNode;

      // Receive processed audio frames from the worklet thread
      workletNode.port.onmessage = (
        event: MessageEvent<{ type: string; samples: Float32Array }>,
      ) => {
        if (event.data.type === "pcm" && isActive) {
          const int16Samples = pcmFloat32ToInt16(event.data.samples);
          onAudioChunk?.(int16Samples);
        }
      };

      source.connect(workletNode);
      // NOTE: Do NOT connect to audioContext.destination to avoid microphone feedback
    } catch (error) {
      console.error("[AudioCapture] Failed to start audio capture:", error);
    }
  }, [inputDeviceId, onAudioChunk, isActive]);

  const stopRecording = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
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
