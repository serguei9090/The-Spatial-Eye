import { useMemo } from "react";

import type { Highlight } from "@/lib/types";

export function useHighlightDetection(highlights: Highlight[], maxAgeMs = 8_000): Highlight[] {
  return useMemo(() => {
    const now = Date.now();
    return highlights.filter((h) => {
      const isYoungEnough = now - h.timestamp <= maxAgeMs;
      // If confidence is present, enforce 85% threshold
      const isConfident = h.confidence === undefined || h.confidence >= 0.85;
      return isYoungEnough && isConfident;
    });
  }, [highlights, maxAgeMs]);
}
