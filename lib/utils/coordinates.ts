import type { Highlight } from "@/lib/types";

export interface PixelBox {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export function normalizedToPixels(
  coordinates: [number, number, number, number],
  videoWidth: number,
  videoHeight: number,
): PixelBox {
  const [ymin, xmin, ymax, xmax] = coordinates;

  return {
    top: (ymin / 1000) * videoHeight,
    left: (xmin / 1000) * videoWidth,
    bottom: (ymax / 1000) * videoHeight,
    right: (xmax / 1000) * videoWidth,
  };
}

export function highlightToCircle(highlight: Highlight, videoWidth: number, videoHeight: number) {
  const box = normalizedToPixels(
    [highlight.ymin, highlight.xmin, highlight.ymax, highlight.xmax],
    videoWidth,
    videoHeight,
  );

  const width = Math.max(0, box.right - box.left);
  const height = Math.max(0, box.bottom - box.top);

  return {
    cx: box.left + width / 2,
    cy: box.top + height / 2,
    radius: Math.max(width, height) / 2,
  };
}
