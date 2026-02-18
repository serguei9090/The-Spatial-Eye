import type { Highlight } from "@/lib/types";

export type CoordinatesTuple = [number, number, number, number];

const COORDINATE_PATTERN =
  /\[(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\]/g;

export function buildGeminiWsUrl(apiKey: string): string {
  return `wss://generativelanguage.googleapis.com/google.ai.generativelanguage.v1alpha.GenerativeService/BidiGenerateContent?key=${apiKey}`;
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
