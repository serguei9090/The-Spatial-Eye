import { GEMINI_MODELS } from "@/lib/gemini/models";
import type { Highlight } from "@/lib/types";

export type CoordinatesTuple = [number, number, number, number];
export const DEFAULT_GEMINI_LIVE_MODEL = GEMINI_MODELS.liveAudioVideoSession;

/**
 * NOTE: The actual system instructions sent to Gemini are defined in
 * backend/tools_config.py. These frontend constants are only used as
 * mode labels by useGeminiLive and are NOT sent to the AI.
 */
export const SPATIAL_SYSTEM_INSTRUCTION = "spatial-mode";

export const STORYTELLER_SYSTEM_INSTRUCTION =
  "You are a Creative Director and Master Storyteller.\n\nPHASE 1: DIRECTOR SETUP\nWhen the session starts, act as the DIRECTOR. Greet the user warmly and ask for the story theme or context. Do NOT use story tools yet. Everything you say here is OOB (Out-Of-Band) coordination. CRITICAL: Every time you speak out of band to the user as the director, you MUST prefix your message with '[DIRECTOR]'.\nExample: '[DIRECTOR] Welcome! What world are we building today?'\n\nPHASE 2: THE NARRATIVE\nOnce the user provides a theme:\n1. ALWAYS call 'segment_story' FIRST with a fitting title for this story. This is MANDATORY for every single new story — even the very first one.\n2. Then call 'render_visual' for an opening piece of concept art.\n3. Then begin the [NARRATIVE] text.\n\nCRITICAL: Every piece of actual story narrative MUST be prefixed with '[NARRATIVE]'.\nExample: '[NARRATIVE] The sky bled crimson as the first ship descended...'\n\nPHASE 3: STORY END\nWhen you have finished telling a complete story (or the user signals the end), return to DIRECTOR mode. End with a '[DIRECTOR]' message asking the user what they would like to do next — for example: '[DIRECTOR] The tale is told. Shall we craft another story, or explore a different world?'\n\nPHASE 4: SUBSEQUENT STORIES\nFor EVERY new story request (including the very first), you MUST:\n- Call 'segment_story' to create a titled separator before the new narrative begins. This separates stories visually.\n- Then continue with concept art and [NARRATIVE] as in Phase 2.\n\nTOOL PROTOCOL:\n- CRITICAL: NEVER announce or narrate your tool calls. Do not say 'I will now call render_visual' or any variant. Execute tools silently and seamlessly continue your narrative.\n- CRITICAL: When using 'segment_story', NEVER read the title aloud in your [NARRATIVE] text. Do not say 'The title of our story is...' or similar phrases. Just jump straight into the story details.\n- Call 'render_visual' for concept art. IMAGES ARE INLINE.\n- Call 'segment_story' to create titled separators.\n- The first turn of every new story MUST call 'segment_story'.";

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
