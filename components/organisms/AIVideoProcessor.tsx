"use client";

import { useStudioContext } from "@/lib/store/studio-context";
import { useEffect, useRef } from "react";

export function AIVideoProcessor() {
  const { isListening, isConnected, mode, videoRef, isUserTalking, isAiTalking, sendVideoFrame } =
    useStudioContext();

  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    const worker = new Worker("/worklets/video-processor.worker.js");

    worker.onmessage = (e) => {
      if (e.data.type === "frame") {
        const base64 = e.data.data;
        if (base64) sendVideoFrame(base64, "image/jpeg");
      } else if (e.data.type === "error") {
        console.error("[AIVideoProcessor Worker Error]", e.data.error);
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, [sendVideoFrame]);

  // Capture Constants
  const CAPTURE_WIDTH = 1024;
  const CAPTURE_HEIGHT = 576;

  useEffect(() => {
    if (!isListening || !isConnected || mode === "it-architecture") return;

    // Adaptive interval: 500ms when active (talking), 2000ms when idle
    const currentInterval = isUserTalking || isAiTalking ? 500 : 2000;

    const intervalId = globalThis.setInterval(async () => {
      if (isConnected && isListening && workerRef.current) {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.videoWidth === 0) return;

        let imageBitmap: ImageBitmap | null = null;
        try {
          // 1. Capture ImageBitmap from video (off-thread capable)
          imageBitmap = await createImageBitmap(video, {
            resizeWidth: CAPTURE_WIDTH,
            resizeHeight: CAPTURE_HEIGHT,
            resizeQuality: "medium",
          });

          // 2. Post to worker (transferable)
          workerRef.current.postMessage(
            {
              imageBitmap,
              width: CAPTURE_WIDTH,
              height: CAPTURE_HEIGHT,
              quality: 0.65,
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
  }, [isConnected, isListening, mode, isUserTalking, isAiTalking, videoRef]);

  return null; // This component is logic-only
}
