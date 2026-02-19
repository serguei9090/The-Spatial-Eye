import { useEffect, useRef, useState } from "react";

import { HighlightCircle } from "@/components/atoms/HighlightCircle";
import type { Highlight } from "@/lib/types";
import { projectHighlightToScreen } from "@/lib/utils/coordinates";

interface SpatialOverlayProps {
  highlights: Highlight[];
  videoWidth: number;
  videoHeight: number;
}

export function SpatialOverlay({ highlights, videoWidth, videoHeight }: SpatialOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 h-full w-full">
      <svg
        className="h-full w-full"
        // We don't use viewBox scaling anymore; we project to pixel coordinates directly
        // to match the CSS object-fit: cover behavior of the video.
      >
        <title>Detected object overlay</title>
        {highlights.map((highlight) => {
          const circle = projectHighlightToScreen(
            highlight,
            videoWidth,
            videoHeight,
            containerSize.width,
            containerSize.height,
          );

          return (
            <HighlightCircle
              key={highlight.id}
              id={highlight.id}
              cx={circle.cx}
              cy={circle.cy}
              radius={circle.radius}
            />
          );
        })}
      </svg>
    </div>
  );
}
