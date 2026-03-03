/**
 * Global AI Vision Constants
 * Ensure these match between:
 * - AIVideoProcessor.tsx (capture)
 * - SpatialView.tsx (display)
 * - Backend main.py (MEDIA_RESOLUTION_MEDIUM)
 */
export const AI_VISION = {
  CAPTURE_WIDTH: 1024,
  CAPTURE_HEIGHT: 576,
  CAPTURE_QUALITY: 0.65,
  ADAPTIVE_INTERVAL_ACTIVE: 500, // ms
  ADAPTIVE_INTERVAL_IDLE: 2000, // ms
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
