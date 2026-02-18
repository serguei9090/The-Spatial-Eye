"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AudioCapture } from "@/components/organisms/AudioCapture";
import { HUDPanel } from "@/components/organisms/HUDPanel";
import { SpatialOverlay } from "@/components/organisms/SpatialOverlay";
import { VideoFeed } from "@/components/organisms/VideoFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useAudioDevices } from "@/lib/hooks/useAudioDevices";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import { useHighlightDetection } from "@/lib/hooks/useHighlightDetection";

export function SpatialExperience() {
  const {
    user,
    isLoading: authLoading,
    error: authError,
    signInWithGoogle,
    signOutUser,
  } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
  const [isListening, setIsListening] = useState(false);
  const {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    outputSelectionSupported,
    setSelectedInputId,
    setSelectedOutputId,
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
    void checkModelAvailability();
  }, [checkModelAvailability]);

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
    if (!isConnected && !isConnecting && isListening) {
      setIsListening(false);
    }
  }, [isConnected, isConnecting, isListening]);

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

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checking authentication...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in with Google to use The Spatial Eye</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Authentication is required before Gemini Live sessions can start.
          </p>
          {authError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {authError}
            </p>
          ) : null}
          <Button onClick={() => void signInWithGoogle()}>Continue with Google</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-card/60 px-4 py-2">
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email ?? user.uid}</span>
        </p>
        <Button variant="outline" onClick={() => void signOutUser()}>
          Sign out
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <HUDPanel
            isConnected={isConnected}
            isConnecting={isConnecting}
            isListening={isListening}
            modelAvailability={modelAvailability}
            inputDevices={inputDevices}
            outputDevices={outputDevices}
            selectedInputId={selectedInputId}
            selectedOutputId={selectedOutputId}
            outputSelectionSupported={outputSelectionSupported}
            activeHighlight={activeHighlight}
            onToggleListening={onToggleListening}
            onInputDeviceChange={setSelectedInputId}
            onOutputDeviceChange={setSelectedOutputId}
          />
          <AudioCapture inputDeviceId={selectedInputId} />
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
    </div>
  );
}
