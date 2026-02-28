import { HighlightCircle } from "@/components/atoms/HighlightCircle";
import { SpatialGrid } from "@/components/atoms/SpatialGrid";
import { useSettings } from "@/lib/store/settings-context";
import type { Highlight } from "@/lib/types";
import { calculateObjectFit, projectHighlightToScreen } from "@/lib/utils/coordinates";
import { useEffect, useRef, useState } from "react";

interface SpatialOverlayProps {
  highlights: Highlight[];
  videoWidth: number;
  videoHeight: number;
  fit?: "cover" | "contain";
}

export function SpatialOverlay({
  highlights,
  videoWidth,
  videoHeight,
  fit = "cover",
}: SpatialOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const { showDebugGrid, highlightType } = useSettings();

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

  const fitParams = calculateObjectFit(
    videoWidth,
    videoHeight,
    containerSize.width,
    containerSize.height,
    fit,
  );

  if (containerSize.width === 0 || containerSize.height === 0) {
    return (
      <div ref={containerRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    );
  }

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 h-full w-full">
      <svg
        className="h-full w-full"
        // We don't use viewBox scaling anymore; we project to pixel coordinates directly
        // to match the CSS object-fit behavior of the video.
      >
        <title>Detected object overlay</title>

        {showDebugGrid && (
          <SpatialGrid
            videoWidth={videoWidth}
            videoHeight={videoHeight}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            scale={fitParams.scale}
            offsetX={fitParams.offsetX}
            offsetY={fitParams.offsetY}
          />
        )}

        {highlights.map((highlight) => {
          const geometry = projectHighlightToScreen(
            highlight,
            videoWidth,
            videoHeight,
            containerSize.width,
            containerSize.height,
            fit,
          );

          return (
            <HighlightCircle
              key={highlight.id}
              id={highlight.id}
              type={highlightType}
              geometry={geometry}
            />
          );
        })}
      </svg>
    </div>
  );
}
