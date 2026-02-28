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
 * Calculates scale and offset to replicate object-fit behavior.
 */
export function calculateObjectFit(
  contentW: number,
  contentH: number,
  containerW: number,
  containerH: number,
  fit: "cover" | "contain" = "cover",
) {
  // Prevent division by zero or NaN
  if (!contentW || !contentH || !containerW || !containerH) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const contentRatio = contentW / contentH;
  const containerRatio = containerW / containerH;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (fit === "cover") {
    if (containerRatio > contentRatio) {
      // Container is wider -> Fit Width, Crop Height
      scale = containerW / contentW;
      offsetY = (containerH - contentH * scale) / 2;
    } else {
      // Container is taller -> Fit Height, Crop Width
      scale = containerH / contentH;
      offsetX = (containerW - contentW * scale) / 2;
    }
  } else {
    // fit === "contain"
    if (containerRatio > contentRatio) {
      // Container is wider -> Fit Height, Centered Width
      scale = containerH / contentH;
      offsetX = (containerW - contentW * scale) / 2;
    } else {
      // Container is taller -> Fit Width, Centered Height
      scale = containerW / contentW;
      offsetY = (containerH - contentH * scale) / 2;
    }
  }

  return { scale, offsetX, offsetY };
}

/**
 * @deprecated Use calculateObjectFit instead
 */
export function calculateObjectFitCover(
  contentW: number,
  contentH: number,
  containerW: number,
  containerH: number,
) {
  return calculateObjectFit(contentW, contentH, containerW, containerH, "cover");
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
  fit: "cover" | "contain" = "cover",
) {
  const { scale, offsetX, offsetY } = calculateObjectFit(
    videoWidth,
    videoHeight,
    containerWidth,
    containerHeight,
    fit,
  );

  // Default values to 0 if coordinate fields are missing
  const ymin = highlight.ymin ?? 0;
  const xmin = highlight.xmin ?? 0;
  const ymax = highlight.ymax ?? 0;
  const xmax = highlight.xmax ?? 0;

  // 1. Normalized to Intrinsic Video Dimensions
  const hWidthIntrinsic = ((xmax - xmin) / 1000) * videoWidth;
  const hHeightIntrinsic = ((ymax - ymin) / 1000) * videoHeight;
  const intrinsicCenterX = ((xmin + xmax) / 2 / 1000) * videoWidth;
  const intrinsicCenterY = ((ymin + ymax) / 2 / 1000) * videoHeight;

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
    cx: screenCenterX || 0,
    cy: screenCenterY || 0,
    radius: radiusMax || 0,
    fittedRadius: radiusFitted || 0,

    // Rect props (Top-Left Origin)
    x: screenCenterX - screenWidth / 2 || 0,
    y: screenCenterY - screenHeight / 2 || 0,
    width: screenWidth || 0,
    height: screenHeight || 0,
  };
}
