import { type FunctionDeclaration, Type } from "@google/genai";

/**
 * Tool for the model to highlight objects in the UI.
 * This separates the "action" (drawing) from the "speech" (response).
 */
export const highlightTool: FunctionDeclaration = {
  name: "track_and_highlight",
  description:
    "REQUIRED for Spatial Awareness: precise object locating. Instead of a bounding box, find the CENTER POINT of the object. Return the normalized center coordinates (0-1000). Also return a 'render_scale' (0-1000) that represents the approximate radius or size of the object relative to the screen, but keep it tight. Supports identifying MULTIPLE objects at once.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      objects: {
        type: Type.ARRAY,
        description: "List of objects to highlight",
        items: {
          type: Type.OBJECT,
          properties: {
            label: {
              type: Type.STRING,
              description: "Label of the object (e.g. 'Coffee Cup')",
            },
            center_x: {
              type: Type.NUMBER,
              description: "Center X coordinate (0-1000)",
            },
            center_y: {
              type: Type.NUMBER,
              description: "Center Y coordinate (0-1000)",
            },
            render_scale: {
              type: Type.NUMBER,
              description:
                "Approximate size/radius of the object (0-1000). Keep it tight to the object.",
            },
          },
          required: ["label", "center_x", "center_y", "render_scale"],
        },
      },
    },
    required: ["objects"],
  },
};

export const GEMINI_TOOLS = {
  functionDeclarations: [highlightTool],
};
