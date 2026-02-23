"use client";

import type { LiveServerMessage } from "@google/genai";
import { useState } from "react";

import { SPATIAL_SYSTEM_INSTRUCTION } from "@/lib/api/gemini_websocket";
import { SPATIAL_TOOLS } from "@/lib/gemini/tools/definitions";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";
import type { Highlight } from "@/lib/types";

export function useSpatialLive() {
  const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
  const [latestTranscript, setLatestTranscript] = useState<string>("");

  const handleToolCall = (toolCall: LiveServerMessage["toolCall"]) => {
    if (!toolCall?.functionCalls) return;

    for (const fc of toolCall.functionCalls) {
      if (fc.name === "track_and_highlight") {
        // Robust typing for the flat args
        const args = fc.args as {
          label?: string;
          center_x?: number;
          center_y?: number;
          render_scale?: number;
        };

        if (args && typeof args.center_x === "number" && typeof args.center_y === "number") {
          const cx = Number(args.center_x);
          const cy = Number(args.center_y);
          const r = Number(args.render_scale || 50) / 2;

          const highlightId = crypto.randomUUID();

          const newHighlight = {
            id: highlightId,
            objectName: args.label || "Detected Object",
            ymin: Math.max(0, cy - r),
            xmin: Math.max(0, cx - r),
            ymax: Math.min(1000, cy + r),
            xmax: Math.min(1000, cx + r),
            timestamp: Date.now(),
          };

          setActiveHighlights((prev) => [...prev, newHighlight]);

          // Auto-clear after 3 seconds
          setTimeout(() => {
            setActiveHighlights((prev) => prev.filter((h) => h.id !== highlightId));
          }, 3000);
        }
      }
    }
  };

  const handleTranscript = (text: string) => {
    setLatestTranscript((prev) => prev + text);
  };

  const core = useGeminiCore({
    systemInstruction: SPATIAL_SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: SPATIAL_TOOLS }],
    mode: "spatial",
    onToolCall: handleToolCall,
    onTranscript: handleTranscript,
  });

  return {
    ...core,
    activeHighlights,
    latestTranscript,
  };
}
