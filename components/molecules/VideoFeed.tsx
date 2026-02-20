"use client";

import { useEffect } from "react";

interface VideoFeedProps {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly deviceId?: string;
  readonly onVideoReady?: () => void;
  readonly className?: string;
  readonly enabled?: boolean;
}

export function VideoFeed({
  videoRef,
  deviceId,
  onVideoReady,
  className,
  enabled = true,
}: VideoFeedProps) {
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const stopCamera = () => {
      if (videoRef.current?.srcObject) {
        for (const track of (videoRef.current.srcObject as MediaStream).getTracks()) {
          track.stop();
        }
        videoRef.current.srcObject = null;
      }
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        stream = null;
      }
    };

    const startCamera = async () => {
      if (!enabled) {
        stopCamera();
        return;
      }

      // Stop any existing tracks before switching
      stopCamera();

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
      stopCamera();
    };
  }, [deviceId, onVideoReady, videoRef, enabled]);

  if (!enabled) return null;

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
