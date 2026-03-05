"use client";

import { AI_VISION } from "@/lib/constants";
import { useStudioContext } from "@/lib/store/studio-context";
import { useEffect, useRef } from "react";

let globalCaptureCanvas: HTMLCanvasElement | null = null;

export function AIVideoProcessor() {
  const {
    isListening,
    isConnected,
    mode,
    videoRef,
    isUserTalking,
    isAiTalking,
    sendVideoFrame,
  } = useStudioContext();

  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    const worker = new Worker("/worklets/video-processor.worker.js");

    worker.onmessage = (e) => {
      if (e.data.type === "frame") {
        const base64 = e.data.data;
        if (base64)
          sendVideoFrame(base64, "image/jpeg", e.data.width, e.data.height);
      } else if (e.data.type === "error") {
        console.error("[AIVideoProcessor Worker Error]", e.data.error);
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, [sendVideoFrame]);

  const {
    CAPTURE_MAX_DIMENSION,
    CAPTURE_QUALITY,
    ADAPTIVE_INTERVAL_ACTIVE,
    ADAPTIVE_INTERVAL_IDLE,
  } = AI_VISION;

  useEffect(() => {
    if (!isListening || !isConnected || mode === "it-architecture") return;

    // Adaptive interval handling
    const currentInterval =
      isUserTalking || isAiTalking
        ? ADAPTIVE_INTERVAL_ACTIVE
        : ADAPTIVE_INTERVAL_IDLE;

    const intervalId = globalThis.setInterval(async () => {
      if (isConnected && isListening && workerRef.current) {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.videoWidth === 0) return;

        let imageBitmap: ImageBitmap | null = null;
        try {
          // 1. Bulletproof Canvas Capture
          // Avoid direct createImageBitmap(video) as some browsers/devices fail
          // Cookbook: Ensure max dimension is capped properly while maintaining intrinsic aspect ratio
          const MAX_DIMENSION = CAPTURE_MAX_DIMENSION; // usually 1024
          let targetW = video.videoWidth;
          let targetH = video.videoHeight;

          if (targetW > targetH) {
            if (targetW > MAX_DIMENSION) {
              targetH *= MAX_DIMENSION / targetW;
              targetW = MAX_DIMENSION;
            }
          } else if (targetH > MAX_DIMENSION) {
            targetW *= MAX_DIMENSION / targetH;
            targetH = MAX_DIMENSION;
          }

          // Use a singleton canvas to avoid memory churn
          globalCaptureCanvas ??= document.createElement("canvas");
          const canvas = globalCaptureCanvas;
          canvas.width = Math.round(targetW);
          canvas.height = Math.round(targetH);

          const ctx = canvas.getContext("2d", { willReadFrequently: false });
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          imageBitmap = await createImageBitmap(canvas);

          // 2. Post to worker (transferable)
          workerRef.current.postMessage(
            {
              imageBitmap,
              width: imageBitmap.width,
              height: imageBitmap.height,
              quality: CAPTURE_QUALITY,
            },
            [imageBitmap],
          );
        } catch (err) {
          console.error("[AIVideoProcessor] Frame Capture Error:", err);
          // Only close if we didn't successfully transfer it to the worker
          if (imageBitmap) imageBitmap.close();
        }
      }
    }, currentInterval);

    return () => clearInterval(intervalId);
  }, [
    isConnected,
    isListening,
    mode,
    isUserTalking,
    isAiTalking,
    videoRef,
    CAPTURE_MAX_DIMENSION,
    CAPTURE_QUALITY,
    ADAPTIVE_INTERVAL_ACTIVE,
    ADAPTIVE_INTERVAL_IDLE,
  ]);

  return null; // This component is logic-only
}
