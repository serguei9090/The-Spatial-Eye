import { GEMINI_MODELS } from "@/lib/gemini/models";
import type { Highlight } from "@/lib/types";

export type CoordinatesTuple = [number, number, number, number];
export const DEFAULT_GEMINI_LIVE_MODEL = GEMINI_MODELS.liveAudioVideoSession;
export const DEFAULT_GEMINI_TTS_MODEL = GEMINI_MODELS.tts;

/**
 * System instruction that tells Gemini Live to output bounding box coordinates
 * in [ymin, xmin, ymax, xmax] format normalized to 0-1000, enabling the
 * SpatialOverlay to draw highlight circles on detected objects.
 */
export const SPATIAL_SYSTEM_INSTRUCTION =
  "You are a spatial assistant with the ability to see and locate objects in the video feed. When the user asks you to find, locate, circle, or mark an object, you MUST call the 'track_and_highlight' function. Ensure the bounding box TIGHTLY encloses the object with minimal margin. Precision is key for the spatial overlay. Provide a natural verbal confirmation like 'I see it here.' while the tool highlights the object.";

const COORDINATE_PATTERN =
  /\[(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\]/g;

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

export function buildGeminiWsUrl(keyOrToken: string): string {
  const baseUrl =
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
  if (keyOrToken.startsWith("AIza")) {
    return `${baseUrl}?key=${encodeURIComponent(keyOrToken)}`;
  }
  return `${baseUrl}?access_token=${encodeURIComponent(keyOrToken)}`;
}

// ---------------------------------------------------------------------------
// Setup message
// ---------------------------------------------------------------------------

/**
 * Sends the required BidiGenerateContent setup payload over the WebSocket
 * immediately after the connection opens. Without this, the Gemini Live API
 * has no context about the model, system prompt, or response modalities and
 * will not respond correctly.
 */
export function sendSetupMessage(ws: WebSocket, model: string): void {
  const modelId = model.startsWith("models/") ? model : `models/${model}`;

  // Using camelCase and ensuring the most stable payload structure
  // for the Multimodal Live API (v1beta).
  const setupPayload = {
    setup: {
      model: modelId,
      generationConfig: {
        responseModalities: ["audio"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck",
            },
          },
        },
      },
      systemInstruction: {
        parts: [{ text: SPATIAL_SYSTEM_INSTRUCTION }],
      },
    },
  };

  console.log(
    "[GeminiLive] Sending Setup Payload (Refined):",
    JSON.stringify(setupPayload, null, 2),
  );
  ws.send(JSON.stringify(setupPayload));
}

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

export function extractCoordinateTuples(content: string): CoordinatesTuple[] {
  const results: CoordinatesTuple[] = [];

  for (const match of content.matchAll(COORDINATE_PATTERN)) {
    const tuple: CoordinatesTuple = [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
    ];

    if (isCoordinateTupleValid(tuple)) {
      results.push(tuple);
    }
  }

  return results;
}

export function isCoordinateTupleValid([ymin, xmin, ymax, xmax]: CoordinatesTuple): boolean {
  return ymin >= 0 && xmin >= 0 && ymax <= 1000 && xmax <= 1000 && ymax > ymin && xmax > xmin;
}

export function tupleToHighlight(tuple: CoordinatesTuple, index: number): Highlight {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${index}`;

  return {
    id,
    objectName: `detected-object-${index + 1}`,
    ymin: tuple[0],
    xmin: tuple[1],
    ymax: tuple[2],
    xmax: tuple[3],
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Message parsers
// ---------------------------------------------------------------------------

interface LiveServerMessage {
  serverContent?: {
    modelTurn?: {
      parts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    };
    interrupted?: boolean;
    inputTranscription?: { text: string };
    outputTranscription?: { text: string };
  };
  text?: string;
}

function parseLiveMessage(raw: string): LiveServerMessage | null {
  try {
    return JSON.parse(raw) as LiveServerMessage;
  } catch {
    return null;
  }
}

export function extractTextsFromLiveServerMessage(raw: string): string[] {
  const parsed = parseLiveMessage(raw);
  if (!parsed) return [raw];

  const texts: string[] = [];

  // 1. Text Parts from Model Turn
  const modelTextParts =
    parsed.serverContent?.modelTurn?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => Boolean(text)) ?? [];
  texts.push(...modelTextParts);

  // 2. Transcriptions
  if (parsed.serverContent?.outputTranscription?.text) {
    texts.push(parsed.serverContent.outputTranscription.text);
  }
  if (parsed.serverContent?.inputTranscription?.text) {
    // Optionally include input transcription (what the user said)
    // console.log("[GeminiLive] User said:", parsed.serverContent.inputTranscription.text);
  }

  // 3. Simple text field (deprecated or used for basic turns)
  if (parsed.text) {
    texts.push(parsed.text);
  }

  return texts;
}

export function extractAudioFromLiveServerMessage(raw: string): string | null {
  const parsed = parseLiveMessage(raw);
  if (!parsed) return null;

  const part = parsed.serverContent?.modelTurn?.parts?.find((p) =>
    p.inlineData?.mimeType.startsWith("audio/"),
  );

  return part?.inlineData?.data ?? null;
}

export function isInterrupted(raw: string): boolean {
  const parsed = parseLiveMessage(raw);
  return !!parsed?.serverContent?.interrupted;
}
