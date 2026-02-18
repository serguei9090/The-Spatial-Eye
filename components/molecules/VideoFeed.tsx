"use client";

import { useEffect } from "react";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  deviceId?: string;
  onVideoReady?: () => void;
  className?: string;
}

export function VideoFeed({ videoRef, deviceId, onVideoReady, className }: VideoFeedProps) {
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      // Stop any existing tracks before switching
      if (videoRef.current?.srcObject) {
        for (const track of (videoRef.current.srcObject as MediaStream).getTracks()) {
          track.stop();
        }
        videoRef.current.srcObject = null;
      }

      try {
        const videoConstraints: MediaTrackConstraints = deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "environment" };

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
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
      for (const track of stream?.getTracks() ?? []) {
        track.stop();
      }
    };
  }, [deviceId, onVideoReady, videoRef]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={className || "h-screen w-full object-cover"}
      />
    </div>
  );
}
