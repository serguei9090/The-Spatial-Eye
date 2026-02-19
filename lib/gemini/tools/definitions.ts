import { type FunctionDeclaration, Type } from "@google/genai";

/**
 * Tool definition for tracking and highlighting objects in the spatial view.
 * Now supports multi-object selection via the `objects` array.
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

/**
 * Collection of tools available for Spatial/Live mode.
 */
export const SPATIAL_TOOLS = [highlightTool];

/**
 * Creative Director Tools
 */

export const renderVisualTool: FunctionDeclaration = {
  name: "render_visual",
  description:
    "Orders a visual asset that matches the current user-defined theme. Use this to visualize key story elements.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      asset_type: {
        type: Type.STRING,
        enum: ["STILL_IMAGE", "CINEMAGRAPH", "DIAGRAM"],
        description: "The type of visual asset to generate.",
      },
      subject: {
        type: Type.STRING,
        description:
          "The specific item/action to visualize (e.g., 'A cracked viewport showing the abyss').",
      },
      visual_context: {
        type: Type.STRING,
        description:
          "Style/Vibe context based on the user's brief (e.g., 'Murky, blue, bioluminescent highlights').",
      },
    },
    required: ["asset_type", "subject", "visual_context"],
  },
};

export const ambientAudioTool: FunctionDeclaration = {
  name: "ambient_audio",
  description: "Sets the sonic mood based on the user's input or story progression.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      preset: {
        type: Type.STRING,
        enum: ["ominous", "airy", "tech", "nature", "custom"],
        description: "The base audio preset to use.",
      },
      vibe_description: {
        type: Type.STRING,
        description:
          "Detailed description of the soundscape (e.g., 'Low thrumming of engines, distant whale song').",
      },
    },
    required: ["preset", "vibe_description"],
  },
};

export const defineWorldRuleTool: FunctionDeclaration = {
  name: "define_world_rule",
  description:
    "Hard-fixes a law of physics/logic for the session based on the user's environment or story needs.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      rule_name: {
        type: Type.STRING,
        description: "Short name for the rule (e.g., 'Underwater Physics', 'Low Gravity').",
      },
      description: {
        type: Type.STRING,
        description: "Explanation of the rule.",
      },
      consequence: {
        type: Type.STRING,
        description: "How this rule affects the user or story.",
      },
    },
    required: ["rule_name", "description", "consequence"],
  },
};

export const DIRECTOR_TOOLS = [renderVisualTool, /* ambientAudioTool, */ defineWorldRuleTool];
