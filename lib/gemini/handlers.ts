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
      const args = fc.args as { objects?: unknown[] };
      const objects = args.objects;

      if (Array.isArray(objects)) {
        // Robust filtering
        const validObjects = objects.filter(
          (
            obj,
          ): obj is { label: string; center_x: number; center_y: number; render_scale: number } =>
            typeof obj === "object" && obj !== null && "center_x" in obj,
        );

        if (validObjects.length > 0) {
          console.log("[SpatialHandler] Highlight Objects:", validObjects);
          const newHighlights = validObjects.map((obj) => {
            const cx = Number(obj.center_x);
            const cy = Number(obj.center_y);
            const r = Number(obj.render_scale) / 2;
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
