import { GEMINI_MODELS } from "@/lib/gemini/models";
import type { Highlight } from "@/lib/types";

export type CoordinatesTuple = [number, number, number, number];
export const DEFAULT_GEMINI_LIVE_MODEL = GEMINI_MODELS.liveAudioVideoSession;

/**
 * System instruction that tells Gemini Live to output bounding box coordinates
 * in [ymin, xmin, ymax, xmax] format normalized to 0-1000, enabling the
 * SpatialOverlay to draw highlight circles on detected objects.
 */
export const SPATIAL_SYSTEM_INSTRUCTION =
  "You are a high-precision spatial processing unit. Your mission is to provide 10/10 accuracy in object localization on a 1000x1000 normalized grid representing the camera feed.\n\nSPATIAL PRECISION PROTOCOLS:\n1. ABSOLUTE CENTROID: When identifying an object, you MUST find the mathematical center (center_x, center_y) of its visible mass. Do not be off-center.\n2. STRICT SELECTION: Only call 'track_and_highlight' for objects specifically requested by the user. Never highlight background elements or unrequested items.\n3. COORDINATE CALIBRATION: Imagine 0,0 at the top-left and 1000,1000 at the bottom-right. Mentally verify the coordinates before tool execution.\n4. RENDER SCALE: The 'render_scale' must tightly encompass the object. If narrow, use a smaller scale. If wide, use a larger scale.\n5. NOISE REJECTION: Completely ignore background chatter or distant voices. Only respond to the primary, clear user voice.\n\nBefore calling the tool, perform a quick visual verification. If an object is obscured, inform the user instead of guessing. Confirm with a concise 'Targeting the [object] now.'";

export const STORYTELLER_SYSTEM_INSTRUCTION =
  "You are a Creative Director and Master Storyteller. \n\nPHASE 1: DIRECTOR SETUP\nWhen the session starts, act as the DIRECTOR. Greet the user warmly and ask for the story theme or context. Do NOT use story tools yet. Everything you say here is OOB (Out-Of-Band) coordination. CRITICAL: Every time you speak out of band to the user as the director, you MUST prefix your message with '[DIRECTOR]'.\nExample: '[DIRECTOR] Welcome! What world are we building today?'\n\nPHASE 2: THE NARRATIVE\nOnce the user provides a theme, transition into STORYTELLER mode. \nCRITICAL: Every time you provide a piece of the actual story narrative, you MUST prefix that specific message with '[NARRATIVE]'. \nExample: '[NARRATIVE] The sky bled crimson as the first ship descended...'\n\nIf the user stops the session and starts again to continue the story, you MUST first call 'segment_story' to title the new section before you resume the [NARRATIVE].\n\nTOOL PROTOCOL:\n- CRITICAL: NEVER announce or narrate your tool calls. Do not say 'I will now call render_visual' or any variant. Execute tools silently and seamlessly continue your narrative.\n- Call 'render_visual' for concept art. IMAGES ARE INLINE.\n- Call 'segment_story' when the user changes topic, or when returning from a break. Title the new section.\n- Call 'ambient_audio' (presets: ominous, airy, tech, nature).\n- Call 'track_and_highlight' to ground the story in visible objects.\n- Call 'define_world_rule' for consistent story laws.\n\nKeep your [DIRECTOR] chatter separate from the [NARRATIVE] text.";

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
// Setup message (Legacy - mostly handled by SDK now, but kept for reference)
// ---------------------------------------------------------------------------

export function sendSetupMessage(ws: WebSocket, model: string): void {
  const modelId = model.startsWith("models/") ? model : `models/${model}`;

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

  // 3. Simple text field
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
