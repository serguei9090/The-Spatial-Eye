import type { Highlight } from "@/lib/types";

export type CoordinatesTuple = [number, number, number, number];
export const DEFAULT_GEMINI_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
export const DEFAULT_GEMINI_TTS_MODEL = "gemini-2.5-pro-preview-tts";
export const SPATIAL_SYSTEM_INSTRUCTION =
  "When identifying objects, output coordinates in the format [ymin, xmin, ymax, xmax] normalized to 0-1000 range.";

const COORDINATE_PATTERN =
  /\[(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\]/g;

export function buildGeminiWsUrl(ephemeralToken: string): string {
  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(ephemeralToken)}`;
}

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

export function extractTextsFromLiveServerMessage(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as {
      serverContent?: {
        modelTurn?: {
          parts?: Array<{ text?: string }>;
        };
      };
      text?: string;
    };

    const texts =
      parsed.serverContent?.modelTurn?.parts
        ?.map((part) => part.text)
        .filter((text): text is string => Boolean(text)) ?? [];

    if (parsed.text) {
      texts.push(parsed.text);
    }

    return texts;
  } catch {
    return [raw];
  }
}
