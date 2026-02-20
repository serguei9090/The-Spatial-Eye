/**
 * GEMINI MODEL REGISTRY (Source of Truth)
 * Based on AI Studio Verified Models & Limits (2026-02)
 *
 * REFERENCE TABLE (RPM / TPM / RPD):
 * | Model                                    | RPM   | TPM    | RPD      |
 * |------------------------------------------|-------|--------|----------|
 * | Gemini 2.5 Flash Native Audio Dialog      | 1     | 1M     | Unlimited|
 * | Gemini 2.5 Flash                         | 1K    | 1M     | 10K      |
 * | Gemini 2.5 Pro                           | 150   | 2M     | 1K       |
 * | Gemini 2 Flash                           | 2K    | 4M     | Unlimited|
 * | Nano Banana (Gemini 2.5 Flash Image)     | 500   | 500K   | 2K       |
 * | Nano Banana Pro (Gemini 3 Pro Image)     | 20 (Q)| 100K   | 250      |
 * | Veo 3 Fast Generate                      | 2     | N/A    | 10       |
 * | Gemini 3 Pro                             | 25    | 1M     | 250      |
 */

export interface ModelMetadata {
  id: string;
  displayName: string;
  category: "Text-out" | "Multi-modal" | "Live" | "Agents" | "Other";
  limits: {
    rpm: number; // Requests Per Minute
    tpm: number; // Tokens Per Minute
    rpd: number; // Requests Per Day
  };
  role: string;
}

export const GEMINI_REGISTRY: Record<string, ModelMetadata> = {
  live: {
    id: "gemini-2.5-flash-native-audio-preview-12-2025",
    displayName: "Gemini 2.5 Flash Native Audio",
    category: "Live",
    limits: { rpm: 1000, tpm: 1000000, rpd: 0 }, // Unlimited RPD usually for Flash
    role: "Powers real-time voice and camera stream in all modes.",
  },
  image: {
    id: "gemini-2.5-flash-image",
    displayName: "Nano Banana",
    category: "Multi-modal",
    limits: { rpm: 500, tpm: 500000, rpd: 2000 },
    role: "Generates professional illustrations and storyboard frames.",
  },
  video: {
    id: "veo-3.1-fast-generate-preview",
    displayName: "Veo 3.1 Fast Generate",
    category: "Multi-modal",
    limits: { rpm: 2, tpm: 0, rpd: 10 },
    role: "Generates high-fidelity video assets via the Veo engine.",
  },
  reasoning: {
    id: "gemini-2-flash",
    displayName: "Gemini 2 Flash",
    category: "Text-out",
    limits: { rpm: 2000, tpm: 4000000, rpd: 0 }, // Unlimited RPD
    role: "High-speed reasoning and research (2K RPM).",
  },
  lowCost: {
    id: "gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash Lite",
    category: "Text-out",
    limits: { rpm: 4000, tpm: 4000000, rpd: 0 },
    role: "Highest throughput for background tasks (4K RPM).",
  },
};
