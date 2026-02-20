import { notifyModelError } from "@/lib/gemini/model-error";
import { GEMINI_MODELS } from "@/lib/gemini/models";
import type { StoryItem } from "@/lib/types";
import { GoogleGenAI, type LiveServerMessage } from "@google/genai";
import type { Dispatch, SetStateAction } from "react";

// Helper to create a UUID (simple version for browser)
const generateId = () => crypto.randomUUID();

/** Inline SVG used as a card placeholder when Nano Banana fails or is unavailable. */
const IMAGE_PLACEHOLDER_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#0f172a"/>
  <text x="400" y="290" font-family="monospace" font-size="18" fill="rgba(148,163,184,0.6)" text-anchor="middle">Image unavailable</text>
  <text x="400" y="320" font-family="monospace" font-size="13" fill="rgba(148,163,184,0.35)" text-anchor="middle">Nano Banana could not generate a visual</text>
</svg>
`)}`;

/**
 * Handles 'Director' tool calls for the Storyteller mode.
 */
interface DirectorArgs {
  asset_type?: string;
  subject?: string;
  visual_context?: string;
  preset?: string;
  vibe_description?: string;
  rule_name?: string;
  description?: string;
  consequence?: string;
  title?: string;
}

export function handleDirectorToolCall(
  toolCall: LiveServerMessage["toolCall"],
  setStoryStream: Dispatch<SetStateAction<StoryItem[]>>,
) {
  if (!toolCall?.functionCalls) return;

  for (const fc of toolCall.functionCalls) {
    const args = fc.args as DirectorArgs;

    if (fc.name === "render_visual") {
      const { asset_type, subject, visual_context } = args;
      const id = generateId();

      // 1. Add Placeholder
      setStoryStream((prev) => [
        ...prev,
        {
          id,
          type: "image",
          content: `Visualizing: ${subject || "Scene"}`,
          isGenerating: true,
          metadata: {
            asset_type: asset_type || "image",
            visual_context: visual_context || "",
            subject: subject || "",
          },
          timestamp: Date.now(),
        },
      ]);

      // 2. Trigger Generation (Real Gemini API)
      const modelId = GEMINI_MODELS.imageSynthesis.replace(/^models\//, "");
      console.log(`[Director] render_visual triggered for: "${subject}" using model: ${modelId}`);

      (async () => {
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
          if (!apiKey) throw new Error("No API Key");

          const client = new GoogleGenAI({ apiKey });
          console.log("[Director] Calling generateContent...");

          const response = await client.models.generateContent({
            model: modelId,
            contents: [
              {
                parts: [
                  {
                    text: `Generate a detailed, cinematic, high-quality image of: ${subject}. Context: ${visual_context}. Style: Photorealistic, 8k resolution, dramatic lighting.`,
                  },
                ],
              },
            ],
            config: {
              // Must specify IMAGE modality — without this the model returns text only
              responseModalities: ["IMAGE", "TEXT"],
            },
          });

          console.log(
            "[Director] generateContent response received. Candidates:",
            response.candidates?.length,
          );

          // Extract Image
          const candidates = response.candidates;
          const imagePart = candidates?.[0]?.content?.parts?.find(
            (p) => "inlineData" in p && p.inlineData?.mimeType?.startsWith("image"),
          ) as { inlineData: { mimeType: string; data: string } } | undefined;

          if (imagePart?.inlineData) {
            console.log("[Director] Image data found, updating card.");
            const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

            setStoryStream((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, isGenerating: false, content: base64Image } : item,
              ),
            );
          } else {
            console.warn(
              "[Director] No image inlineData in response. Parts:",
              candidates?.[0]?.content?.parts,
            );
            throw new Error("No image data in response");
          }
        } catch (error) {
          console.error("[Director] Image generation failed:", error);
          // Route through shared utility — classifies rate_limit / billing / not_found
          notifyModelError(GEMINI_MODELS.imageSynthesis, error);

          // Replace the card with a clean SVG placeholder instead of a broken image
          setStoryStream((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    isGenerating: false,
                    content: IMAGE_PLACEHOLDER_SVG,
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
          content: vibe_description || "Ambient Sound",
          metadata: { preset: preset || "default" },
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
          content: rule_name || "New Rule",
          metadata: { description: description || "", consequence: consequence || "" },
          timestamp: Date.now(),
        },
      ]);
    } else if (fc.name === "segment_story") {
      const { title } = args;
      setStoryStream((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "story_segment",
          content: title || "New Chapter",
          timestamp: Date.now(),
        },
      ]);
    }
  }
}
