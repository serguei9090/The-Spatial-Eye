import { type FunctionDeclaration, Type } from "@google/genai";

/**
 * Tool for the model to highlight objects in the UI.
 * This separates the "action" (drawing) from the "speech" (response).
 */
export const highlightTool: FunctionDeclaration = {
  name: "track_and_highlight",
  description:
    "REQUIRED for Spatial Awareness: Pinpoint and circle an object. You MUST calculate a TIGHT bounding box around the visible object. The box should encompass the object precisely with minimal background margin. If the object moves, re-calculate coordinates (0-1000) based on the latest video frame.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      ymin: {
        type: Type.NUMBER,
        description: "Top Y coordinate (0-1000)",
      },
      xmin: {
        type: Type.NUMBER,
        description: "Left X coordinate (0-1000)",
      },
      ymax: {
        type: Type.NUMBER,
        description: "Bottom Y coordinate (0-1000)",
      },
      xmax: {
        type: Type.NUMBER,
        description: "Right X coordinate (0-1000)",
      },
      label: {
        type: Type.STRING,
        description: "Label of the object (e.g. 'Coffee Cup')",
      },
    },
    required: ["ymin", "xmin", "ymax", "xmax", "label"],
  },
};

export const GEMINI_TOOLS = {
  functionDeclarations: [highlightTool],
};
