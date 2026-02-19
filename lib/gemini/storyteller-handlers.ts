import { GEMINI_MODELS } from "@/lib/gemini/models";
import type { StoryItem } from "@/lib/types";
import { GoogleGenAI, type LiveServerMessage } from "@google/genai";
import type { Dispatch, SetStateAction } from "react";

// Helper to create a UUID (simple version for browser)
const generateId = () => crypto.randomUUID();

/**
 * Handles 'Director' tool calls for the Storyteller mode.
 * - render_visual: Adds a placeholder, then (mock) generates an image.
 * - ambient_audio: Adds an audio event item.
 * - define_world_rule: Adds a rule event item.
 */
export function handleDirectorToolCall(
  toolCall: LiveServerMessage["toolCall"],
  setStoryStream: Dispatch<SetStateAction<StoryItem[]>>,
) {
  if (!toolCall?.functionCalls) return;

  for (const fc of toolCall.functionCalls) {
    // biome-ignore lint/suspicious/noExplicitAny: Args vary by tool
    const args = fc.args as any;

    if (fc.name === "render_visual") {
      const { asset_type, subject, visual_context } = args;
      const id = generateId();

      // 1. Add Placeholder
      setStoryStream((prev) => [
        ...prev,
        {
          id,
          type: "image",
          content: `Visualizing: ${subject}`,
          isGenerating: true,
          metadata: { asset_type, visual_context },
          timestamp: Date.now(),
        },
      ]);

      // 2. Trigger Generation (Real Gemini API)
      console.log(`[Director] Generating with ${GEMINI_MODELS.imageSynthesis}: ${subject}`);

      (async () => {
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
          if (!apiKey) throw new Error("No API Key");

          const client = new GoogleGenAI({ apiKey });
          const response = await client.models.generateContent({
            model: GEMINI_MODELS.imageSynthesis,
            contents: [
              {
                parts: [
                  {
                    text: `Generate a detailed, cinematic, high-quality image of: ${subject}. Context: ${visual_context}. Style: Photorealistic, 8k resolution, dramatic lighting.`,
                  },
                ],
              },
            ],
          });

          // Extract Image
          const candidates = response.candidates;
          const imagePart = candidates?.[0]?.content?.parts?.find(
            (p) => "inlineData" in p && p.inlineData?.mimeType?.startsWith("image"),
          ) as { inlineData: { mimeType: string; data: string } } | undefined;

          if (imagePart?.inlineData) {
            const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

            setStoryStream((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, isGenerating: false, content: base64Image } : item,
              ),
            );
          } else {
            throw new Error("No image data in response");
          }
        } catch (error) {
          console.error("[Director] Image Gen Failed:", error);
          setStoryStream((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    isGenerating: false,
                    content: "https://loremflickr.com/800/600/glitch,error", // Fallback
                    metadata: { ...item.metadata, error: "Generation Failed" },
                  }
                : item,
            ),
          );
        }
      })();
    } else if (fc.name === "ambient_audio") {
      const { preset, vibe_description } = args;
      setStoryStream((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "audio_event",
          content: vibe_description,
          metadata: { preset },
          timestamp: Date.now(),
        },
      ]);
    } else if (fc.name === "define_world_rule") {
      const { rule_name, description, consequence } = args;
      setStoryStream((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "rule_event",
          content: rule_name,
          metadata: { description, consequence },
          timestamp: Date.now(),
        },
      ]);
    }
  }
}
