"use client";

import type { Highlight } from "@/lib/types";

import { HighlightCircle } from "@/components/molecules/HighlightCircle";

interface SpatialOverlayProps {
  highlights: Highlight[];
  videoWidth: number;
  videoHeight: number;
}

export function SpatialOverlay({ highlights, videoWidth, videoHeight }: SpatialOverlayProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      preserveAspectRatio="none"
      aria-label="Detected object overlay"
      role="img"
    >
      <title>Detected object overlay</title>
      {highlights.map((highlight) => (
        <HighlightCircle
          key={highlight.id}
          highlight={highlight}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
        />
      ))}
    </svg>
  );
}
