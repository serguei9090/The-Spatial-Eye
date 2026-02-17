"use client";

import { useEffect } from "react";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onVideoReady?: () => void;
}

export function VideoFeed({ videoRef, onVideoReady }: VideoFeedProps) {
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          onVideoReady?.();
        }
      } catch {
        // Ignore camera errors at this layer; parent hook handles user-facing errors.
      }
    };

    void startCamera();

    return () => {
      mounted = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onVideoReady, videoRef]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
      <video ref={videoRef} className="h-full min-h-[360px] w-full object-cover" playsInline muted />
    </div>
  );
}
