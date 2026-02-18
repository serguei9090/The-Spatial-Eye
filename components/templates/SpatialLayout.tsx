"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AIOrb } from "@/components/atoms/AIOrb";
import { PremiumBackground } from "@/components/backgrounds/PremiumBackground";
import { AudioCapture } from "@/components/molecules/AudioCapture";
import { ControlBar } from "@/components/organisms/ControlBar";
import { SpatialOverlay } from "@/components/molecules/SpatialOverlay";
import { VideoFeed } from "@/components/molecules/VideoFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { useAudioDevices } from "@/lib/hooks/useAudioDevices";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import { useHighlightDetection } from "@/lib/hooks/useHighlightDetection";

export function SpatialLayout() {
  const {
    user,
    isLoading: authLoading,
    error: authError,
    getIdToken,
    signInWithGoogle,
    signOutUser,
  } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
  const [isListening, setIsListening] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [personalApiKey, setPersonalApiKey] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isClearingKey, setIsClearingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
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

  const onSavePersonalKey = useCallback(async () => {
    setKeyError(null);
    setKeyMessage(null);

    const idToken = await getIdToken();
    if (!idToken) {
      setKeyError("Sign in is required before storing a personal key.");
      return;
    }

    try {
      setIsSavingKey(true);
      const response = await fetch("/api/gemini/key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ apiKey: personalApiKey }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to store personal key.");
      }
      setKeyMessage("Personal Gemini API key saved.");
      setPersonalApiKey("");
      void checkModelAvailability();
    } catch (error) {
      setKeyError(error instanceof Error ? error.message : "Unable to store personal key.");
    } finally {
      setIsSavingKey(false);
    }
  }, [checkModelAvailability, getIdToken, personalApiKey]);

  const onUseAppKey = useCallback(async () => {
    setKeyError(null);
    setKeyMessage(null);

    const idToken = await getIdToken();
    if (!idToken) {
      setKeyError("Sign in is required before updating key preference.");
      return;
    }

    try {
      setIsClearingKey(true);
      const response = await fetch("/api/gemini/key", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to switch to app key.");
      }
      setKeyMessage("Personal key removed. The app fallback key will be used.");
      void checkModelAvailability();
    } catch (error) {
      setKeyError(error instanceof Error ? error.message : "Unable to switch to app key.");
    } finally {
      setIsClearingKey(false);
    }
  }, [checkModelAvailability, getIdToken]);

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
    <>
      <PremiumBackground />

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-end p-4 sm:p-8">
        {/* Floating Dock - Centered at bottom */}
        <div className="pointer-events-auto mx-auto w-full max-w-2xl animate-in slide-in-from-bottom-10 fade-in duration-700">
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
            activeHighlight={activeHighlight}
            onToggleListening={onToggleListening}
            onInputDeviceChange={setSelectedInputId}
            onOutputDeviceChange={setSelectedOutputId}
            onVideoDeviceChange={setSelectedVideoId}
          />
        </div>
      </div>

      <div className="hidden">
        <AudioCapture
          isActive={isListening}
          onAudioChunk={sendAudioChunk}
          inputDeviceId={selectedInputId}
        />
      </div>

      <section className="relative h-screen w-full overflow-hidden">
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
      </section>

      <Dialog open={isApiModalOpen} onOpenChange={setIsApiModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gemini API Key</DialogTitle>
            <DialogDescription>
              Add your personal key (optional). If none is saved, the app fallback key from server
              env is used.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="AIza..."
              value={personalApiKey}
              onChange={(event) => setPersonalApiKey(event.target.value)}
            />
            {keyMessage ? <p className="text-sm text-emerald-600">{keyMessage}</p> : null}
            {keyError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {keyError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => void onUseAppKey()}
              disabled={isSavingKey || isClearingKey}
            >
              {isClearingKey ? "Switching..." : "Use App Key"}
            </Button>
            <Button
              onClick={() => void onSavePersonalKey()}
              disabled={!personalApiKey.trim() || isSavingKey || isClearingKey}
            >
              {isSavingKey ? "Saving..." : "Save Personal Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
