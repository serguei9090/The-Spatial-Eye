"use client";

import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import type { Highlight, StoryItem } from "@/lib/types";
import { downloadDiagram, uploadDiagram } from "@/lib/utils/diagram-export";
import type { Connection, Edge, Node, OnEdgesChange, OnNodesChange } from "@xyflow/react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { useSearchParams } from "next/navigation";
import {
  type MutableRefObject,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type AppMode = "spatial" | "storyteller" | "it-architecture";

interface StudioContextType {
  // Mode State
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  handleModeChange: (newMode: AppMode) => void;

  // AI Session State (from useGeminiLive)
  isConnected: boolean;
  isConnecting: boolean;
  isListening: boolean;
  isAiTalking: boolean;
  isUserTalking: boolean;
  error: string | null;
  errorCode: string | undefined;
  errorMessage: string | undefined;
  latestTranscript: string;

  // Mode-specific Data
  activeHighlights: Highlight[];
  storyStream: StoryItem[];
  nodes: Node[];
  edges: Edge[];

  // Video State
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  videoSize: { width: number; height: number };
  updateVideoSize: () => void;

  // Actions
  connect: () => Promise<boolean>;
  disconnect: () => void;
  onToggleListening: () => void;
  sendVideoFrame: (base64: string, mimeType: string) => void;
  sendAudioChunk: (data: Blob | Int16Array) => void;
  setIsUserTalking: (isTalking: boolean) => void;

  // Diagram Actions
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  handleDownload: () => void;
  handleUpload: (file: File) => Promise<void>;
  fitViewCounter: number;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") as AppMode;

  const [mode, setMode] = useState<AppMode>(
    initialMode && ["spatial", "it-architecture", "storyteller"].includes(initialMode)
      ? initialMode
      : "spatial",
  );

  const [isListening, setIsListening] = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [fitViewCounter, setFitViewCounter] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    connect: coreConnect,
    disconnect: coreDisconnect,
    sendVideoFrame,
    sendAudioChunk,
    error,
    errorCode,
    errorMessage,
    checkModelAvailability,
  } = useGeminiLive({
    mode,
    onTurnComplete: () => {
      if (mode === "it-architecture") {
        setFitViewCounter((prev) => prev + 1);
      }
    },
  });

  useEffect(() => {
    checkModelAvailability();
  }, [checkModelAvailability]);

  const handleModeChange = useCallback(
    (newMode: AppMode) => {
      if (mode === newMode) return;
      if (isListening || isConnected) {
        coreDisconnect();
        setIsListening(false);
      }
      setMode(newMode);
    },
    [mode, isListening, isConnected, coreDisconnect],
  );

  const onToggleListening = useCallback(() => {
    if (isListening) {
      coreDisconnect();
      setIsListening(false);
    } else {
      coreConnect().then((connected) => {
        if (connected) setIsListening(true);
      });
    }
  }, [coreConnect, coreDisconnect, isListening]);

  const updateVideoSize = useCallback(() => {
    if (!videoRef.current) return;
    setVideoSize({
      width: videoRef.current.videoWidth || videoRef.current.clientWidth,
      height: videoRef.current.videoHeight || videoRef.current.clientHeight,
    });
  }, []);

  // Diagram Handlers
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const handleDownload = useCallback(() => {
    downloadDiagram(nodes, edges);
  }, [nodes, edges]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const { nodes: uploadedNodes, edges: uploadedEdges } = await uploadDiagram(file);
        setNodes(uploadedNodes);
        setEdges(uploadedEdges);
      } catch (err) {
        console.error("Failed to upload diagram:", err);
      }
    },
    [setNodes, setEdges],
  );

  const value: StudioContextType = {
    mode,
    setMode,
    handleModeChange,
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
    storyStream,
    nodes,
    edges,
    videoRef,
    videoSize,
    updateVideoSize,
    connect: coreConnect,
    disconnect: coreDisconnect,
    onToggleListening,
    sendVideoFrame,
    sendAudioChunk,
    setIsUserTalking,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleDownload,
    handleUpload,
    fitViewCounter,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudioContext() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error("useStudioContext must be used within a StudioProvider");
  }
  return context;
}
