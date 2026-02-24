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

/**
 * Calculates scale and offset to replicate object-fit: cover
 */
export function calculateObjectFitCover(
  contentW: number,
  contentH: number,
  containerW: number,
  containerH: number,
) {
  const contentRatio = contentW / contentH;
  const containerRatio = containerW / containerH;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (containerRatio > contentRatio) {
    // Container is wider -> Fit Width, Crop Height
    scale = containerW / contentW;
    offsetY = (containerH - contentH * scale) / 2;
  } else {
    // Container is taller -> Fit Height, Crop Width
    scale = containerH / contentH;
    offsetX = (containerW - contentW * scale) / 2;
  }

  return { scale, offsetX, offsetY };
}

/**
 * Projects a normalized highlight [0-1000] to screen coordinates
 * replicating 'object-fit: cover' logic.
 */
export function projectHighlightToScreen(
  highlight: Highlight,
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number,
) {
  const { scale, offsetX, offsetY } = calculateObjectFitCover(
    videoWidth,
    videoHeight,
    containerWidth,
    containerHeight,
  );

  // 1. Normalized to Intrinsic Video Dimensions
  const hWidthIntrinsic = ((highlight.xmax - highlight.xmin) / 1000) * videoWidth;
  const hHeightIntrinsic = ((highlight.ymax - highlight.ymin) / 1000) * videoHeight;
  const intrinsicCenterX = ((highlight.xmin + highlight.xmax) / 2 / 1000) * videoWidth;
  const intrinsicCenterY = ((highlight.ymin + highlight.ymax) / 2 / 1000) * videoHeight;

  // 2. Apply Object Fit Transform to Center and Scale Dimensions
  const screenCenterX = intrinsicCenterX * scale + offsetX;
  const screenCenterY = intrinsicCenterY * scale + offsetY;
  const screenWidth = hWidthIntrinsic * scale;
  const screenHeight = hHeightIntrinsic * scale;

  // 3. Calculate derived radii
  // "Circle" mode: Max dimension
  const radiusMax = Math.max(screenWidth, screenHeight) / 2;
  // "Fitted Circle" mode: Min dimension + 10%
  const radiusFitted = (Math.min(screenWidth, screenHeight) / 2) * 1.1;

  return {
    // Circle props
    cx: screenCenterX,
    cy: screenCenterY,
    radius: radiusMax,
    fittedRadius: radiusFitted,

    // Rect props (Top-Left Origin)
    x: screenCenterX - screenWidth / 2,
    y: screenCenterY - screenHeight / 2,
    width: screenWidth,
    height: screenHeight,
  };
}
