import { type FunctionDeclaration, Type } from "@google/genai";

/**
 * Tool definition for tracking and highlighting objects in the spatial view.
 * Now supports multi-object selection via the `objects` array.
 */
export const highlightTool: FunctionDeclaration = {
  name: "track_and_highlight",
  description:
    "REQUIRED for Spatial Awareness: precise object locating. Instead of a bounding box, find the CENTER POINT of the object. Return the normalized center coordinates (0-1000). Also return a 'render_scale' (0-1000) that represents the approximate radius or size of the object relative to the screen, but keep it tight. If there are MULTIPLE objects, call this tool MULTIPLE times in parallel.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      label: {
        type: Type.STRING,
        description: "A short, human-readable label of the object (e.g. 'Coffee Cup').",
      },
      center_x: {
        type: Type.NUMBER,
        description: "Center X coordinate on a 0-1000 normalized grid.",
      },
      center_y: {
        type: Type.NUMBER,
        description: "Center Y coordinate on a 0-1000 normalized grid.",
      },
      render_scale: {
        type: Type.NUMBER,
        description: "Approximate radius/size of the visible object (0-1000).",
      },
    },
    required: ["label", "center_x", "center_y", "render_scale"],
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
        description:
          "Must strictly be one of: STILL_IMAGE, CINEMAGRAPH, or DIAGRAM. Do not guess any other value.",
      },
      subject: {
        type: Type.STRING,
        description:
          "The precise action/item/character to be drawn. E.g. 'A cracked viewport with stars'. Make it highly descriptive. Do not hallucinate elements the user hasn't introduced.",
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
        description: "Must be a valid preset from the list exactly. Do not invent an audio preset.",
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

export const segmentStoryTool: FunctionDeclaration = {
  name: "segment_story",
  description:
    "Call this when the current story arc ends or the user changes the topic significantly. It creates a visual break (like a new chapter or horizontal rule) to separate the new content from the old.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description:
          "The exact title text you want displayed (e.g. 'Chapter 2: The Deep Ocean'). Keep it short and dramatic.",
      },
    },
    required: ["title"],
  },
};

export const DIRECTOR_TOOLS = [
  renderVisualTool,
  /* ambientAudioTool, */ defineWorldRuleTool,
  segmentStoryTool,
];
