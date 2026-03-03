/**
 * Global AI Vision Constants
 * Ensure these match between:
 * - AIVideoProcessor.tsx (capture)
 * - SpatialView.tsx (display)
 * - Backend main.py (MEDIA_RESOLUTION_MEDIUM)
 */
export const AI_VISION = {
  CAPTURE_MAX_DIMENSION: 1024,
  CAPTURE_QUALITY: 0.65,
  ADAPTIVE_INTERVAL_ACTIVE: 500, // ms
  ADAPTIVE_INTERVAL_IDLE: 2000, // ms
  /** Mirrors backend SPATIAL_DIAGNOSTICS. Set NEXT_PUBLIC_SPATIAL_DIAGNOSTICS=true to enable. */
  SPATIAL_DIAGNOSTICS: process.env.NEXT_PUBLIC_SPATIAL_DIAGNOSTICS === "true",
};

/**
 * UI / UX Layout Constants
 */
export const UI_LAYERS = {
  VIDEO: 0,
  OVERLAYS: 10,
  TRANSCRIPT: 50,
  CONTROLS: 60,
  ERRORS: 100,
  POPOVERS: 200,
};
