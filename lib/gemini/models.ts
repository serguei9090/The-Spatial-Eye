/**
 * Gemini model identifiers used across the application.
 *
 * All model IDs are verified against the Gemini v1beta API as of 2026-02.
 * Override any model via environment variables without code changes.
 *
 * ⚠️  VIDEO_SYNTHESIS_DISABLED is intentional — Veo generation is not free-tier
 *     compatible and is gated behind the flag so it cannot be accidentally invoked.
 */
export const GEMINI_MODELS = {
  /**
   * Used for general text / search tasks and brand copy generation.
   * gemini-2.5-flash-lite is cost-efficient and has wide context support.
   */
  brandCopyAndSearch: process.env.NEXT_PUBLIC_GEMINI_MODEL_COPY_SEARCH || "gemini-2.5-flash-lite",

  /**
   * Inline image understanding (describe, annotate). Uses gemini-2.5-flash
   * which supports multimodal input including images.
   */
  imageSynthesis: process.env.NEXT_PUBLIC_GEMINI_MODEL_IMAGE || "gemini-2.5-flash",

  /**
   * Primary Gemini Live model for real-time audio + video conversations.
   * gemini-2.5-flash is the most stable Live-capable model currently
   * available (as of 2026-02).
   */
  liveAudioVideoSession:
    process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL || "gemini-2.5-flash-native-audio-latest",

  /**
   * Text-to-Speech synthesis. Uses Gemini 1.5 Flash which has TTS capability
   * via the v1beta generateContent API.
   */
  tts: process.env.NEXT_PUBLIC_GEMINI_TTS_MODEL || "gemini-1.5-flash",

  /**
   * Video generation model — intentionally disabled for free-tier builds.
   * Set VIDEO_SYNTHESIS_DISABLED=false and supply a valid Veo model name
   * (e.g. "veo-2.0-generate-001") when enabling for a paid project.
   */
  videoSynthesis: process.env.NEXT_PUBLIC_GEMINI_MODEL_VIDEO || "veo-2.0-generate-001",
} as const;

// Video generation is disabled for free-tier / hackathon builds.
export const VIDEO_SYNTHESIS_DISABLED = true;
