import type { Highlight } from "@/lib/types";
import type { LiveServerMessage } from "@google/genai";
import type { Dispatch, SetStateAction } from "react";

/**
 * Handles the 'track_and_highlight' tool call.
 * Parses the response, filters invalid objects, and updates the active highlights state.
 */
export function handleSpatialToolCall(
  toolCall: LiveServerMessage["toolCall"],
  setActiveHighlights: Dispatch<SetStateAction<Highlight[]>>,
) {
  if (!toolCall?.functionCalls) return;

  for (const fc of toolCall.functionCalls) {
    if (fc.name === "track_and_highlight") {
      logTrace("Executing track_and_highlight with args:", fc.args);
      const args = fc.args as Record<string, unknown>;

      // Support both direct ADK args AND legacy 'objects' array
      let rawObjects: unknown[] = [];
      if (Array.isArray(args.objects)) {
        rawObjects = args.objects;
      } else if ("center_x" in args || "center_y" in args) {
        // Direct tool call where args is the object itself
        rawObjects = [args];
      }

      if (rawObjects.length > 0) {
        const validObjects = rawObjects.filter(
          (
            obj,
          ): obj is { label: string; center_x: number; center_y: number; render_scale: number } =>
            typeof obj === "object" && obj !== null && "center_x" in obj,
        );

        if (validObjects.length > 0) {
          const newHighlights = validObjects.map((obj) => {
            const cx = Number(obj.center_x);
            const cy = Number(obj.center_y);
            // Default render_scale to 200 if missing
            const r = (Number(obj.render_scale) || 200) / 2;
            return {
              id: crypto.randomUUID(),
              objectName: obj.label || "Detected Object",
              ymin: Math.max(0, cy - r),
              xmin: Math.max(0, cx - r),
              ymax: Math.min(1000, cy + r),
              xmax: Math.min(1000, cx + r),
              timestamp: Date.now(),
            };
          });

          setActiveHighlights((prev) => [...prev, ...newHighlights]);
        }
      }
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
