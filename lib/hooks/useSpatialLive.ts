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
        // Robust typing for the args
        const args = fc.args as { objects?: unknown[] };
        const objects = args.objects;

        if (Array.isArray(objects)) {
          // Filter valid objects to prevent crashes
          const validObjects = objects.filter(
            (
              obj,
            ): obj is { label: string; center_x: number; center_y: number; render_scale: number } =>
              typeof obj === "object" && obj !== null && "center_x" in obj,
          );

          if (validObjects.length > 0) {
            const newHighlights = validObjects.map((obj) => {
              const cx = Number(obj.center_x);
              const cy = Number(obj.center_y);
              const r = Number(obj.render_scale) / 2;
              return {
                id: crypto.randomUUID(),
                objectName: obj.label || "Detected Object",
                ymin: Math.max(0, cy - r),
                xmin: Math.max(0, cx - r),
                ymax: Math.min(1000, cy + r),
                xmax: Math.min(1000, cx + r),
                timestamp: Date.now(),
              };
            });

            setActiveHighlights((prev) => [...prev, ...newHighlights]);

            // Auto-clear after 3 seconds
            setTimeout(() => {
              const idsToRemove = new Set(newHighlights.map((h) => h.id));
              setActiveHighlights((prev) => prev.filter((h) => !idsToRemove.has(h.id)));
            }, 3000);
          }
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
    onToolCall: handleToolCall,
    onTranscript: handleTranscript,
  });

  return {
    ...core,
    activeHighlights,
    latestTranscript,
  };
}
