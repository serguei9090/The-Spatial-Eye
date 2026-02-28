import type { Highlight } from "@/lib/types";
import type { LiveServerMessage } from "@google/genai";
import type { Dispatch, SetStateAction } from "react";

/**
 * Validates and normalizes coordinates within the 0-1000 range.
 */
function normalizeBox(ymin: number, xmin: number, ymax: number, xmax: number) {
  // Ensure we have numbers and handle NaN
  const coords = [ymin, xmin, ymax, xmax].map((v) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : Math.max(0, Math.min(1000, n));
  });

  let [nyMin, nxMin, nyMax, nxMax] = coords;

  // Swap if the model hallucinated the order (min > max)
  if (nyMin > nyMax) [nyMin, nyMax] = [nyMax, nyMin];
  if (nxMin > nxMax) [nxMin, nxMax] = [nxMax, nxMin];

  // If the box is zero-sized, provide a default small expansion
  if (nyMin === nyMax) {
    nyMin = Math.max(0, nyMin - 10);
    nyMax = Math.min(1000, nyMax + 10);
  }
  if (nxMin === nxMax) {
    nxMin = Math.max(0, nxMin - 10);
    nxMax = Math.min(1000, nxMax + 10);
  }

  return { ymin: nyMin, xmin: nxMin, ymax: nyMax, xmax: nxMax };
}

/**
 * Tracks the last turn ID to decide between APPEND (same turn) and REPLACE (new turn).
 * The AI often sends multiple `track_and_highlight` calls within the same turn
 * (one per object). We accumulate within a turn and replace on a new turn.
 */
let lastSpatialTurnId: string | null = null;

/**
 * Handles the 'track_and_highlight' tool call.
 * Parses the response, filters invalid objects, and updates the active highlights state.
 *
 * @param turnId - The current turn/invocation ID. Same turn → append, new turn → replace.
 */
export function handleSpatialToolCall(
  toolCall: LiveServerMessage["toolCall"],
  setActiveHighlights: Dispatch<SetStateAction<Highlight[]>>,
  turnId?: string,
) {
  if (!toolCall?.functionCalls) return;
  const highlightsInCall: Highlight[] = [];

  for (const fc of toolCall.functionCalls) {
    if (fc.name === "track_and_highlight") {
      logTrace("Executing track_and_highlight with args:", fc.args);
      const args = fc.args as Record<string, unknown>;

      // Support both direct ADK args AND legacy 'objects' array
      let rawObjects: unknown[] = [];
      if (Array.isArray(args.objects)) {
        rawObjects = args.objects;
      } else if ("center_x" in args || "center_y" in args || "box_2d" in args || "ymin" in args) {
        // Direct tool call where args is the object itself
        rawObjects = [args];
      }

      for (const item of rawObjects) {
        const obj = item as {
          label?: string;
          box_2d?: number[];
          ymin?: number;
          xmin?: number;
          ymax?: number;
          xmax?: number;
          center_x?: number;
          center_y?: number;
          render_scale?: number;
        };

        const label = obj.label || "Detected Object";
        let newH: Highlight | null = null;

        // 1. Prioritize native box_2d format or direct box properties
        if (Array.isArray(obj.box_2d) && obj.box_2d.length === 4) {
          const [ymin, xmin, ymax, xmax] = obj.box_2d.map(Number);
          const normalized = normalizeBox(ymin, xmin, ymax, xmax);
          newH = {
            id: crypto.randomUUID(),
            objectName: label,
            ...normalized,
            timestamp: Date.now(),
          };
        } else if (
          obj.ymin !== undefined &&
          obj.xmin !== undefined &&
          obj.ymax !== undefined &&
          obj.xmax !== undefined
        ) {
          const normalized = normalizeBox(
            Number(obj.ymin),
            Number(obj.xmin),
            Number(obj.ymax),
            Number(obj.xmax),
          );
          newH = {
            id: crypto.randomUUID(),
            objectName: label,
            ...normalized,
            timestamp: Date.now(),
          };
        }
        // 2. Fallback to center/scale if provided (legacy or model deviation)
        else if (obj.center_x !== undefined && obj.center_y !== undefined) {
          const cx = Number(obj.center_x);
          const cy = Number(obj.center_y);
          const r = (Number(obj.render_scale) || 200) / 2;
          const normalized = normalizeBox(cy - r, cx - r, cy + r, cx + r);
          newH = {
            id: crypto.randomUUID(),
            objectName: label,
            ...normalized,
            timestamp: Date.now(),
          };
        }

        if (newH) highlightsInCall.push(newH);
      }
    } else if (fc.name === "clear_spatial_highlights") {
      logTrace("Executing clear_spatial_highlights");
      lastSpatialTurnId = null;
      setActiveHighlights([]);
      return; // Stop processing further calls in this turn
    }
  }

  if (highlightsInCall.length > 0) {
    const isSameTurn = turnId != null && turnId === lastSpatialTurnId;
    lastSpatialTurnId = turnId ?? null;

    if (isSameTurn) {
      // Same turn → APPEND (AI is sending multiple objects one-by-one)
      setActiveHighlights((prev) => [...prev, ...highlightsInCall]);
    } else {
      // New turn → REPLACE (fresh grounding, discard stale highlights)
      setActiveHighlights(highlightsInCall);
    }
  }
}

// Helper for logging if not imported
const logTrace = (msg: string, ...args: unknown[]) => {
  console.debug(
    `%c[SpatialHandler]%c ${msg}`,
    "color: #3b82f6; font-weight: bold;",
    "color: inherit;",
    ...args,
  );
};
