import { GEMINI_REGISTRY } from "./registry";

/**
 * Helper to ensure model ID has the "models/" prefix
 */
const withPrefix = (id: string) => (id.startsWith("models/") ? id : `models/${id}`);

export const GEMINI_MODELS = {
  /**
   * Used for general text / search tasks and brand copy generation.
   */
  brandCopyAndSearch: withPrefix(
    process.env.NEXT_PUBLIC_GEMINI_MODEL_COPY_SEARCH || GEMINI_REGISTRY.reasoning.id,
  ),

  /**
   * Inline image synthesis.
   */
  imageSynthesis: withPrefix(
    process.env.NEXT_PUBLIC_GEMINI_MODEL_IMAGE || GEMINI_REGISTRY.image.id,
  ),

  /**
   * Primary Gemini Live model for real-time audio + video conversations.
   */
  liveAudioVideoSession: withPrefix(
    process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL || GEMINI_REGISTRY.live.id,
  ),

  /**
   * Text-to-Speech synthesis.
   */
  tts: withPrefix(process.env.NEXT_PUBLIC_GEMINI_TTS_MODEL || "gemini-1.5-flash"),

  /**
   * Video generation model.
   */
  videoSynthesis: withPrefix(
    process.env.NEXT_PUBLIC_GEMINI_MODEL_VIDEO || GEMINI_REGISTRY.video.id,
  ),
} as const;

// Video generation is disabled for free-tier / hackathon builds.
export const VIDEO_SYNTHESIS_DISABLED = true;
