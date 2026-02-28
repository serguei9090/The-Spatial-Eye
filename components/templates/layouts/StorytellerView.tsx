"use client";

import { AIErrorBoundary } from "@/components/atoms/AIErrorBoundary";
import { VideoFeed } from "@/components/molecules/VideoFeed";
import { CreativeStudio } from "@/components/organisms/CreativeStudio";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import { useStudioContext } from "@/lib/store/studio-context";

export function StorytellerView() {
  const { videoRef, storyStream, updateVideoSize } = useStudioContext();
  const { selectedVideoId } = useAudioDeviceContext();

  return (
    <AIErrorBoundary key="storyteller" label="Creative Storyteller">
      <div className="relative h-screen w-full overflow-hidden flex flex-col">
        {/* Hidden Video Feed (Logic Only) - The UI has its own PIP */}
        <div className="fixed inset-0 z-0 opacity-0 pointer-events-none">
          <VideoFeed
            videoRef={videoRef}
            deviceId={selectedVideoId}
            onVideoReady={updateVideoSize}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Main Creative Interface */}
        <div className="flex-1 w-full h-full z-10">
          <CreativeStudio stream={storyStream} videoRef={videoRef} />
        </div>
      </div>
    </AIErrorBoundary>
  );
}
