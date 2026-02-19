"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AIOrb } from "@/components/atoms/AIOrb";
import { PremiumBackground } from "@/components/backgrounds/PremiumBackground";
import { AudioCapture } from "@/components/molecules/AudioCapture";
import { LiveNarration } from "@/components/molecules/LiveNarration";
import { VideoFeed } from "@/components/molecules/VideoFeed";
import { ControlBar } from "@/components/organisms/ControlBar";
import { CreativeBoard } from "@/components/organisms/CreativeBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useAudioDevices } from "@/lib/hooks/useAudioDevices";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import { useHighlightDetection } from "@/lib/hooks/useHighlightDetection";

export function StudioLayout() {
  const { user, isLoading: authLoading, error: authError, signInWithGoogle } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [narration, setNarration] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<
    Array<{ type: "image" | "text"; content: string }>
  >([]);

  const {
    inputDevices,
    outputDevices,
    videoDevices,
    selectedInputId,
    selectedOutputId,
    selectedVideoId,
    outputSelectionSupported,
    setSelectedInputId,
    setSelectedOutputId,
    setSelectedVideoId,
  } = useAudioDevices();

  const {
    activeHighlights,
    isConnected,
    isConnecting,
    errorMessage,
    modelAvailability,
    checkModelAvailability,
    connect,
    disconnect,
    sendVideoFrame,
    sendAudioChunk,
    latestTranscript,
  } = useGeminiLive();

  // Effect to update narration from Gemini transcripts
  useEffect(() => {
    if (latestTranscript) {
      setNarration(latestTranscript);

      const lower = latestTranscript.toLowerCase();
      // Simple heuristic: trigger generation on "imagine", "picture", "draw", "create"
      if (
        (lower.includes("imagine") || lower.includes("picture") || lower.includes("draw")) &&
        !lower.includes("generating") // Avoid loops if the model narrates itself
      ) {
        // Debounce or check recent generations to avoid spam could be added here
        // For now, fire and forget
        void fetch("/api/mock/generate-image", {
          method: "POST",
          body: JSON.stringify({ prompt: latestTranscript }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.url) {
              setGeneratedContent((prev) => [
                ...prev,
                { type: "text", content: latestTranscript },
                { type: "image", content: data.url },
              ]);
            }
          });
      }
    }
  }, [latestTranscript]);

  const updateVideoSize = useCallback(() => {
    // No-op for now in Studio mode, or handle resize logic
  }, []);

  useEffect(() => {
    void checkModelAvailability();
  }, [checkModelAvailability]);

  // … (Keep audio/video sending logic similar to SpatialLayout, simplified for brevity in this first pass)
  // Logic to send frames periodically
  useEffect(() => {
    if (!isListening || !isConnected) return;

    const intervalId = window.setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/webp", 0.75).split(",")[1];
      if (data) sendVideoFrame(data, "image/webp");
    }, 1500); // Slower FPS for Storyteller mode to save bandwidth

    return () => clearInterval(intervalId);
  }, [isConnected, isListening, sendVideoFrame]);

  // Verify component mount
  useEffect(() => {
    console.log("[StudioLayout] Component Mounted");
    return () => console.log("[StudioLayout] Component Unmounted");
  }, []);

  const onToggleListening = useCallback(() => {
    console.log("[StudioLayout] onToggleListening triggered. Current state:", {
      isListening,
      isConnected,
      isConnecting,
    });
    if (isListening) {
      console.log("[StudioLayout] Disconnecting...");
      disconnect();
      setIsListening(false);
    } else {
      console.log("[StudioLayout] Connecting...");
      void connect().then((connected) => {
        console.log("[StudioLayout] Connect result:", connected);
        if (connected) setIsListening(true);
      });
    }
  }, [connect, disconnect, isListening, isConnected, isConnecting]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Loading or Sign In Required...
      </div>
    );
  }

  return (
    <>
      <PremiumBackground />

      {/* Main Studio Grid */}
      <div className="grid h-screen w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        {/* Left Column: Input & Narration */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black">
            <VideoFeed
              videoRef={videoRef}
              deviceId={selectedVideoId}
              onVideoReady={updateVideoSize}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute bottom-4 left-4 right-4">
              <LiveNarration text={narration} isActive={isListening} />
            </div>
          </div>

          {/* Compact Control Bar for Studio */}
          <div className="h-auto shrink-0">
            <ControlBar
              isConnected={isConnected}
              isConnecting={isConnecting}
              isListening={isListening}
              modelAvailability={modelAvailability}
              inputDevices={inputDevices}
              outputDevices={outputDevices}
              videoDevices={videoDevices}
              selectedInputId={selectedInputId}
              selectedOutputId={selectedOutputId}
              selectedVideoId={selectedVideoId}
              outputSelectionSupported={outputSelectionSupported}
              onToggleListening={onToggleListening}
              onInputDeviceChange={setSelectedInputId}
              onOutputDeviceChange={setSelectedOutputId}
              onVideoDeviceChange={setSelectedVideoId}
            />
          </div>
        </div>

        {/* Right Column: Creative Board */}
        <div className="flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <CreativeBoard content={generatedContent} />
        </div>
      </div>

      <div className="hidden">
        <AudioCapture
          isActive={isListening}
          onAudioChunk={sendAudioChunk}
          inputDeviceId={selectedInputId}
        />
      </div>
    </>
  );
}
