"use client";

import { handleSpatialToolCall } from "@/lib/gemini/handlers";
import { useSettings } from "@/lib/store/settings-context";
import type { Highlight } from "@/lib/types";
import type { LiveServerMessage } from "@google/genai";
import { useEffect, useState } from "react";

export function useSpatialMode() {
  const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
  const { highlightDuration } = useSettings();

  // Highlight Pruning Logic
  useEffect(() => {
    if (highlightDuration === "always") return;
    const durationCount = Number(highlightDuration);

    const interval = setInterval(() => {
      setActiveHighlights((prev) => {
        const now = Date.now();
        // Use a small buffer (100ms) to ensure we don't prune highlights
        // that were just created in the same tick.
        const filtered = prev.filter((h) => now - h.timestamp < durationCount + 100);
        return filtered;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [highlightDuration]);

  const handleToolCall = (toolCall: LiveServerMessage["toolCall"], turnId?: string) => {
    handleSpatialToolCall(toolCall, setActiveHighlights, turnId);
  };

  return {
    activeHighlights,
    setActiveHighlights,
    handleSpatialToolCall: handleToolCall,
  };
}
