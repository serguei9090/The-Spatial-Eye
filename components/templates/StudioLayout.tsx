"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { PremiumBackground } from "@/components/backgrounds/PremiumBackground";
import { AudioCapture } from "@/components/molecules/AudioCapture";
import { UserMenu } from "@/components/molecules/UserMenu";
import { AITranscriptOverlay } from "@/components/organisms/AITranscriptOverlay";
import { AIVideoProcessor } from "@/components/organisms/AIVideoProcessor";
import { ControlBar } from "@/components/organisms/ControlBar";
import { ArchitectureView } from "@/components/templates/layouts/ArchitectureView";
import { SpatialView } from "@/components/templates/layouts/SpatialView";
import { StorytellerView } from "@/components/templates/layouts/StorytellerView";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useAudioDeviceContext } from "@/lib/store/audio-context";
import { useStudioContext } from "@/lib/store/studio-context";

export function StudioLayout() {
  const { user, isLoading: authLoading, signInWithGoogle, signOutUser } = useAuth();
  const { selectedInputId } = useAudioDeviceContext();
  const {
    mode,
    isConnected,
    isConnecting,
    isListening,
    isAiTalking,
    isUserTalking,
    error,
    errorCode,
    errorMessage,
    latestTranscript,
    activeHighlights,
    disconnect,
    onToggleListening,
    handleModeChange,
    handleDownload,
    handleUpload,
    sendAudioChunk,
    setIsUserTalking,
  } = useStudioContext();

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
      <AIVideoProcessor />

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

      {/* Mode-Specific Layouts */}
      {mode === "spatial" && <SpatialView />}
      {mode === "storyteller" && <StorytellerView />}
      {mode === "it-architecture" && <ArchitectureView />}

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
            onDownload={handleDownload}
            onUpload={handleUpload}
          />
        </div>
      </div>
    </>
  );
}
