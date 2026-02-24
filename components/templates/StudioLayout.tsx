"use client";

import {
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AIErrorBoundary } from "@/components/atoms/AIErrorBoundary";
import { PremiumBackground } from "@/components/backgrounds/PremiumBackground";
import { AudioCapture } from "@/components/molecules/AudioCapture";
import { SpatialOverlay } from "@/components/molecules/SpatialOverlay";
import { UserMenu } from "@/components/molecules/UserMenu";
import { VideoFeed } from "@/components/molecules/VideoFeed";
import { AITranscriptOverlay } from "@/components/organisms/AITranscriptOverlay";
import { ControlBar } from "@/components/organisms/ControlBar";
import { CreativeStudio } from "@/components/organisms/CreativeStudio";
import { ITArchitectureStudio } from "@/components/organisms/ITArchitectureStudio";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import { useHighlightDetection } from "@/lib/hooks/useHighlightDetection";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import { Loader2 } from "lucide-react";

type AppMode = "spatial" | "storyteller" | "it-architecture";

export function StudioLayout() {
  const { user, isLoading: authLoading, signInWithGoogle, signOutUser } = useAuth();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") as AppMode;

  const [mode, setMode] = useState<AppMode>(
    initialMode && ["spatial", "storyteller", "it-architecture"].includes(initialMode)
      ? initialMode
      : "spatial",
  );
  const { selectedInputId, selectedVideoId } = useAudioDeviceContext();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 }); // Track video size
  const [isListening, setIsListening] = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(false);

  // useAudioDevices is now consumed via context in ControlBar
  // const { ... } = useAudioDevices();

  const {
    activeHighlights,
    storyStream,
    nodes,
    edges,
    setNodes,
    setEdges,
    latestTranscript,
    isConnected,
    isConnecting,
    isAiTalking,
    checkModelAvailability,
    connect,
    disconnect,
    sendVideoFrame,
    sendAudioChunk,
    error,
    errorCode,
    errorMessage,
  } = useGeminiLive({ mode });

  const visibleHighlights = useHighlightDetection(activeHighlights);

  const handleModeChange = useCallback(
    (newMode: "spatial" | "storyteller" | "it-architecture") => {
      if (mode === newMode) return;
      if (isListening || isConnected) {
        disconnect();
        setIsListening(false);
      }
      setMode(newMode);
    },
    [mode, isListening, isConnected, disconnect],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const updateVideoSize = useCallback(() => {
    if (!videoRef.current) return;
    setVideoSize({
      width: videoRef.current.videoWidth || videoRef.current.clientWidth,
      height: videoRef.current.videoHeight || videoRef.current.clientHeight,
    });
  }, []);

  useEffect(() => {
    checkModelAvailability();
  }, [checkModelAvailability]);

  // Logic to send frames periodically
  useEffect(() => {
    if (!isListening || !isConnected || mode === "it-architecture") return;

    const intervalId = globalThis.setInterval(() => {
      if (isConnected && isListening) {
        const video = videoRef.current;
        if (!video) return;

        const canvas = document.createElement("canvas");
        // 480x270 for a bit more detail without hitting limits
        canvas.width = 480;
        canvas.height = 270;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const data = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];
        if (data) sendVideoFrame(data, "image/jpeg");
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isConnected, isListening, mode, sendVideoFrame]);

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
      connect().then((connected) => {
        console.log("[StudioLayout] Connect result:", connected);
        if (connected) setIsListening(true);
      });
    }
  }, [connect, disconnect, isListening, isConnected, isConnecting]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
        <PremiumBackground />
        <div className="z-10 flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-black/40 p-12 backdrop-blur-xl shadow-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/10">
            <div className="h-10 w-10 rounded-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">The Spatial Eye</h1>
            <p className="text-muted-foreground">Sign in to access the studio.</p>
          </div>
          <Button
            size="lg"
            onClick={() => signInWithGoogle()}
            className="w-full text-base font-semibold shadow-lg transition-all hover:scale-105"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PremiumBackground />

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 z-[100] -translate-x-1/2 w-full max-w-md px-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-950/40 p-4 backdrop-blur-xl shadow-2xl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                <div className="h-5 w-5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-red-100">Session Error</p>
                <p className="truncate text-xs text-red-200/60 font-mono">
                  {errorCode}: {errorMessage || error}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnect()}
                className="text-red-200/50 hover:bg-white/5"
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right User Menu */}
      <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
        <UserMenu user={user} onSignOut={signOutUser} />
      </div>

      {/* Global AI Assistant Overlay - Hide in Storyteller mode which has its own stream */}
      {mode !== "storyteller" && <AITranscriptOverlay transcript={latestTranscript} />}

      <div className="hidden">
        <AudioCapture
          isActive={isListening}
          onAudioChunk={sendAudioChunk}
          onTalkingChange={setIsUserTalking}
          inputDeviceId={selectedInputId}
        />
      </div>

      {mode === "spatial" && (
        /* LIVE MODE: Full Screen Layout */
        <AIErrorBoundary key="spatial" label="Spatial mode">
          <div className="relative h-screen w-full overflow-hidden">
            <VideoFeed
              videoRef={videoRef}
              deviceId={selectedVideoId}
              onVideoReady={updateVideoSize}
              className="h-full w-full object-cover"
            />
            <SpatialOverlay
              highlights={visibleHighlights}
              videoWidth={videoSize.width}
              videoHeight={videoSize.height}
            />
          </div>
        </AIErrorBoundary>
      )}

      {mode === "storyteller" && (
        /* STORYTELLER MODE: Full Screen Interleaved Layout */
        <AIErrorBoundary key="storyteller" label="Creative Storyteller">
          <div className="relative h-screen w-full overflow-hidden flex flex-col">
            {/* Hidden Video Feed (Logic Only) - The UI has its own PIP */}
            <div className="absolute inset-0 z-0 opacity-0 pointer-events-none">
              <VideoFeed
                videoRef={videoRef}
                deviceId={selectedVideoId}
                onVideoReady={updateVideoSize}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Main Creative Interface */}
            <div className="flex-1 w-full h-full z-10">
              <CreativeStudio stream={storyStream} videoRef={videoRef} />
            </div>
          </div>
        </AIErrorBoundary>
      )}

      {mode === "it-architecture" && (
        <AIErrorBoundary key="it-architecture" label="IT Architecture Studio">
          <div className="relative h-screen w-full overflow-hidden flex flex-col pt-16 pb-24">
            {/* Main Architecture Interface */}
            <div className="flex-1 w-full h-full z-10">
              <ITArchitectureStudio
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
              />
            </div>
            {/* Hidden Video Feed (Logic Only) */}
            <div className="absolute inset-0 z-0 opacity-0 pointer-events-none">
              <VideoFeed
                videoRef={videoRef}
                enabled={false}
                deviceId={selectedVideoId}
                onVideoReady={updateVideoSize}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </AIErrorBoundary>
      )}

      {/* Floating Control Bar - Always on top for both modes */}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-end p-4 sm:p-8">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl animate-in slide-in-from-bottom-10 fade-in duration-700">
          <ControlBar
            isConnected={isConnected}
            isConnecting={isConnecting}
            isListening={isListening}
            isAiTalking={isAiTalking}
            isUserTalking={isUserTalking}
            activeHighlight={activeHighlights?.[0]}
            mode={mode}
            onToggleListening={onToggleListening}
            onModeChange={handleModeChange}
          />
        </div>
      </div>
    </>
  );
}
