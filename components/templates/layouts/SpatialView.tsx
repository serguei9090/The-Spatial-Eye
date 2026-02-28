"use client";

import { AIErrorBoundary } from "@/components/atoms/AIErrorBoundary";
import { LandscapePrompt } from "@/components/atoms/LandscapePrompt";
import { SpatialOverlay } from "@/components/molecules/SpatialOverlay";
import { VideoFeed } from "@/components/molecules/VideoFeed";
import { useHighlightDetection } from "@/lib/hooks/useHighlightDetection";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import { useStudioContext } from "@/lib/store/studio-context";

export function SpatialView() {
  const { videoRef, activeHighlights, updateVideoSize } = useStudioContext();
  const { selectedVideoId } = useAudioDeviceContext();
  const visibleHighlights = useHighlightDetection(activeHighlights);

  // Constants must match AIVideoProcessor's capture resolution!
  const CAPTURE_WIDTH = 640;
  const CAPTURE_HEIGHT = 360;

  return (
    <AIErrorBoundary key="spatial" label="Spatial mode">
      <div className="fixed inset-0 overflow-hidden bg-black z-0">
        <VideoFeed
          videoRef={videoRef}
          deviceId={selectedVideoId}
          onVideoReady={updateVideoSize}
          className="h-full w-full object-contain"
        />
        <LandscapePrompt />
        <SpatialOverlay
          highlights={visibleHighlights}
          videoWidth={CAPTURE_WIDTH}
          videoHeight={CAPTURE_HEIGHT}
          fit="contain"
        />
      </div>
    </AIErrorBoundary>
  );
}
