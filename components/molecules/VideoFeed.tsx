"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface VideoFeedProps {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly deviceId?: string;
  readonly onVideoReady?: () => void;
  readonly className?: string;
  readonly containerClassName?: string;
  readonly enabled?: boolean;
}

export function VideoFeed({
  videoRef,
  deviceId,
  onVideoReady,
  className,
  containerClassName,
  enabled = true,
}: VideoFeedProps) {
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const stopCamera = () => {
      if (videoRef.current?.srcObject) {
        for (const track of (
          videoRef.current.srcObject as MediaStream
        ).getTracks()) {
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
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            };

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;

          // Fire onVideoReady only after loadedmetadata, which is when
          // video.videoWidth / videoHeight are guaranteed to be populated.
          // Calling it after play() is too early — dimensions may still be 0.
          const handleMetadata = () => {
            if (mounted) onVideoReady?.();
          };
          videoRef.current.addEventListener("loadedmetadata", handleMetadata, {
            once: true,
          });

          await videoRef.current.play();
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
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-black",
        containerClassName,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn("h-full w-full", className)}
      />
    </div>
  );
}
