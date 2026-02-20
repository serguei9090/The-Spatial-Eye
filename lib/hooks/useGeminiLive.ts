"use client";

import type { LiveServerMessage } from "@google/genai";
import { useEffect, useMemo, useState } from "react";

import {
  SPATIAL_SYSTEM_INSTRUCTION,
  STORYTELLER_SYSTEM_INSTRUCTION,
} from "@/lib/api/gemini_websocket";
import { handleSpatialToolCall } from "@/lib/gemini/handlers";
import {
  IT_ARCHITECTURE_SYSTEM_INSTRUCTION,
  IT_ARCHITECTURE_TOOLS,
  handleArchitectureToolCall,
} from "@/lib/gemini/it-architecture-handlers";
import { handleDirectorToolCall } from "@/lib/gemini/storyteller-handlers";
import { DIRECTOR_TOOLS, SPATIAL_TOOLS } from "@/lib/gemini/tools/definitions";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";
import { useSettings } from "@/lib/store/settings-context";
import type { Highlight, StoryItem } from "@/lib/types";
import type { Edge, Node } from "@xyflow/react";

export type GeminiMode = "spatial" | "storyteller" | "it-architecture";

export interface UseGeminiLiveProps {
  mode?: GeminiMode; // default "spatial"
}

export function useGeminiLive({ mode = "spatial" }: UseGeminiLiveProps = {}) {
  const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
  const [storyStream, setStoryStream] = useState<StoryItem[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [latestTranscript, setLatestTranscript] = useState<string>("");

  // Determine configuration based on mode
  let systemInstruction = SPATIAL_SYSTEM_INSTRUCTION;
  if (mode === "storyteller") systemInstruction = STORYTELLER_SYSTEM_INSTRUCTION;
  if (mode === "it-architecture") systemInstruction = IT_ARCHITECTURE_SYSTEM_INSTRUCTION;

  const { highlightDuration } = useSettings();

  // Highlight Pruning Logic
  useEffect(() => {
    if (highlightDuration === "always") return;

    const interval = setInterval(() => {
      setActiveHighlights((prev) => {
        const now = Date.now();
        const duration = Number(highlightDuration);
        const filtered = prev.filter((h) => now - h.timestamp < duration);
        if (filtered.length !== prev.length) {
          console.log(
            `[GeminiLive] Pruned ${prev.length - filtered.length} highlights. Duration setting:`,
            duration,
          );
        }
        return filtered;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [highlightDuration]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset state when mode changes
  useEffect(() => {
    setActiveHighlights([]);
    setStoryStream([]);
    setNodes([]);
    setEdges([]);
    setLatestTranscript("");
  }, [mode]);

  // Tools configuration
  const tools = useMemo(() => {
    if (mode === "storyteller") {
      return [{ functionDeclarations: DIRECTOR_TOOLS }];
    }
    if (mode === "it-architecture") {
      return IT_ARCHITECTURE_TOOLS; // Already wrapped in object
    }
    return [{ functionDeclarations: SPATIAL_TOOLS }];
  }, [mode]);

  // Handler for tool calls
  const handleToolCall = (toolCall: LiveServerMessage["toolCall"]) => {
    if (mode === "spatial") {
      handleSpatialToolCall(toolCall, setActiveHighlights);
    } else if (mode === "storyteller") {
      handleDirectorToolCall(toolCall, setStoryStream);
    } else if (mode === "it-architecture") {
      handleArchitectureToolCall(toolCall, setNodes, setEdges);
    }
  };

  const handleTranscript = (text: string) => {
    // For IT Architecture mode, skip raw tool call strings from transcript
    const isToolCallText = mode === "it-architecture" && /call:\s*\w+|update_diagram/.test(text);
    if (!isToolCallText) {
      // Strip out any partial tool call artifacts that may bleed through
      const cleanText = text.replaceAll(/call:\s*update_diagram[\s\S]*/g, "").trimEnd();
      if (cleanText) setLatestTranscript((prev) => prev + cleanText);
    }

    if (mode !== "storyteller") return;
    setStoryStream((prev) => {
      const last = prev.at(-1);

      // Explicitly check for [DIRECTOR] or [NARRATIVE] tags
      let isNarrative = last?.type === "text" ? last.isStory : false;
      if (text.includes("[NARRATIVE]")) isNarrative = true;
      if (text.includes("[DIRECTOR]")) isNarrative = false;

      // Clean the text of ANY tags
      const cleanText = text.replace("[NARRATIVE]", "").replace("[DIRECTOR]", "").trimStart();

      if (last?.type === "text" && last.isStory === isNarrative) {
        // Detect if we need a space: if the existing content doesn't end with a space
        // and the new chunk doesn't start with a space.
        const needsSpace =
          last.content.length > 0 &&
          !last.content.endsWith(" ") &&
          !cleanText.startsWith(" ") &&
          !cleanText.startsWith(".") &&
          !cleanText.startsWith(",");

        const spacing = needsSpace ? " " : "";

        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + spacing + cleanText, timestamp: Date.now() },
        ];
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "text",
          content: cleanText,
          timestamp: Date.now(),
          isStory: isNarrative,
        },
      ];
    });
  };

  const core = useGeminiCore({
    systemInstruction,
    tools,
    onToolCall: handleToolCall,
    onTranscript: handleTranscript,
  });

  return {
    ...core,
    activeHighlights,
    storyStream,
    nodes,
    edges,
    setNodes,
    setEdges,
    latestTranscript,
    mode,
  };
}
