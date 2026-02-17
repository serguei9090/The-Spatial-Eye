import { useMemo } from "react";

import type { Highlight } from "@/lib/types";

export function useHighlightDetection(highlights: Highlight[], maxAgeMs = 8_000): Highlight[] {
  return useMemo(
    () => highlights.filter((highlight) => Date.now() - highlight.timestamp <= maxAgeMs),
    [highlights, maxAgeMs],
  );
}
