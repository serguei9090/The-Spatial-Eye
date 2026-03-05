"use client";

import { AIErrorBoundary } from "@/components/atoms/AIErrorBoundary";
import { LandscapePrompt } from "@/components/atoms/LandscapePrompt";
import { SpatialOverlay } from "@/components/molecules/SpatialOverlay";
import { VideoFeed } from "@/components/molecules/VideoFeed";
import { useHighlightDetection } from "@/lib/hooks/useHighlightDetection";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import { useStudioContext } from "@/lib/store/studio-context";

export function SpatialView() {
  const { videoRef, activeHighlights, updateVideoSize, videoSize } =
    useStudioContext();
  const { selectedVideoId } = useAudioDeviceContext();
  const visibleHighlights = useHighlightDetection(activeHighlights);

  // Use the actual native video dimensions so the overlay's object-fit math
  // matches exactly what the browser renders — not the (potentially different)
  // capture resolution that was sent to the AI.
  const { width: videoWidth, height: videoHeight } = videoSize;

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
        {videoWidth > 0 && videoHeight > 0 && (
          <SpatialOverlay
            highlights={visibleHighlights}
            videoWidth={videoWidth}
            videoHeight={videoHeight}
            fit="contain"
          />
        )}
      </div>
    </AIErrorBoundary>
  );
}
