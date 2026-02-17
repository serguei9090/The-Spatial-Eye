"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AudioCapture } from "@/components/organisms/AudioCapture";
import { HUDPanel } from "@/components/organisms/HUDPanel";
import { SpatialOverlay } from "@/components/organisms/SpatialOverlay";
import { VideoFeed } from "@/components/organisms/VideoFeed";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import { useHighlightDetection } from "@/lib/hooks/useHighlightDetection";

export function SpatialExperience() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
  const [isListening, setIsListening] = useState(false);

  const {
    activeHighlights,
    isConnected,
    isConnecting,
    errorMessage,
    connect,
    disconnect,
    sendVideoFrame,
  } = useGeminiLive();

  const visibleHighlights = useHighlightDetection(activeHighlights);

  const updateVideoSize = useCallback(() => {
    if (!videoRef.current) {
      return;
    }

    const width = videoRef.current.videoWidth || videoRef.current.clientWidth || 1280;
    const height = videoRef.current.videoHeight || videoRef.current.clientHeight || 720;
    setVideoSize({ width, height });
  }, []);

  useEffect(() => {
    if (!isListening || !isConnected) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/webp", 0.75).split(",")[1];

      if (data) {
        sendVideoFrame(data, "image/webp");
      }
    }, 800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isConnected, isListening, sendVideoFrame]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    toast.error(errorMessage);
  }, [errorMessage]);

  const onToggleListening = useCallback(() => {
    if (isListening) {
      disconnect();
      setIsListening(false);
      return;
    }

    void connect().then((connected) => {
      if (connected) {
        setIsListening(true);
      }
    });
  }, [connect, disconnect, isListening]);

  const activeHighlight = useMemo(() => visibleHighlights[0], [visibleHighlights]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <HUDPanel
          isConnected={isConnected}
          isConnecting={isConnecting}
          isListening={isListening}
          activeHighlight={activeHighlight}
          onToggleListening={onToggleListening}
        />
        <AudioCapture />
      </div>

      <section className="relative">
        <VideoFeed videoRef={videoRef} onVideoReady={updateVideoSize} />
        <SpatialOverlay
          highlights={visibleHighlights}
          videoWidth={videoSize.width}
          videoHeight={videoSize.height}
        />
      </section>
    </div>
  );
}
