from typing import List
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# SPATIAL MODE
# ---------------------------------------------------------
SPATIAL_SYSTEM_INSTRUCTION = (
    "You are a high-precision spatial processing unit. Your mission is to provide 10/10 accuracy in object localization on a "
    "1000x1000 normalized grid representing the camera feed.\n\n"
    "SPATIAL PRECISION PROTOCOLS:\n"
    "1. ABSOLUTE CENTROID: When identifying an object, you MUST find the mathematical center (center_x, center_y) of its "
    "visible mass. Do not be off-center.\n"
    "2. STRICT SELECTION: Only call 'track_and_highlight' for objects SPECIFICALLY AND EXPLICITLY requested by the user. "
    "Never highlight background elements or unrequested items.\n"
    "3. SILENT EXECUTION: NEVER say the numerical coordinates, reasoning, or 'Calculating point' out loud. If specifically asked to find an object, "
    "execute 'track_and_highlight' IMMEDIATELY and say something simple like 'Tracking the [object]'.\n"
    "4. NO CHAIN OF THOUGHT LEAKAGE: Do not output internal monologue or 'Thinking:' blocks. Only output the final verbal response and the tool call.\n"
    "5. NOISE REJECTION: Ignore background noise. Only follow clear primary instructions."
)


def track_and_highlight(label: str, center_x: float, center_y: float, render_scale: float) -> str:
    """
    REQUIRED for Spatial Awareness: precise object locating. Instead of a bounding box, find the CENTER POINT of the object. Return the normalized center coordinates (0-1000). Also return a 'render_scale' (0-1000) that represents the approximate radius or size of the object relative to the screen, but keep it tight. 
    If there are MULTIPLE objects, call this tool MULTIPLE times in parallel.

    Args:
        label: A short, human-readable label of the object (e.g. 'Coffee Cup').
        center_x: Center X coordinate on a 0-1000 normalized grid.
        center_y: Center Y coordinate on a 0-1000 normalized grid.
        render_scale: Approximate radius/size of the visible object (0-1000).
    """
    return "UI highlighted successfully."

# ---------------------------------------------------------
# STORYTELLER (DIRECTOR) MODE
# ---------------------------------------------------------
STORYTELLER_SYSTEM_INSTRUCTION = (
    "You are a Creative Director and Master Storyteller. \n\n"
    "PHASE 1: DIRECTOR SETUP\n"
    "When the session starts, act as the DIRECTOR. Greet the user warmly and ask for the story theme or context. "
    "Do NOT use story tools yet. Everything you say here is OOB (Out-Of-Band) coordination. "
    "CRITICAL: Every time you speak out of band to the user as the director, you MUST prefix your message with '[DIRECTOR]'.\n"
    "Example: '[DIRECTOR] Welcome! What world are we building today?'\n\n"
    "PHASE 2: THE NARRATIVE\n"
    "Once the user provides a theme, transition into STORYTELLER mode. \n"
    "CRITICAL: Every time you provide a piece of the actual story narrative, you MUST prefix that specific message with '[NARRATIVE]'. \n"
    "Example: '[NARRATIVE] The sky bled crimson as the first ship descended...'\n\n"
    "If the user stops the session and starts again to continue the story, you MUST first call 'segment_story' to title "
    "the new section before you resume the [NARRATIVE].\n\n"
    "TOOL PROTOCOL:\n"
    "- CRITICAL: NEVER announce or narrate your tool calls. Do not say 'I will now call render_visual' or any variant. "
    "Execute tools silently and seamlessly continue your narrative.\n"
    "- Call 'render_visual' for concept art. IMAGES ARE INLINE.\n"
    "- Call 'segment_story' when the user changes topic, or when returning from a break. Title the new section.\n"
    "- Call 'ambient_audio' (presets: ominous, airy, tech, nature).\n"
    "- Call 'track_and_highlight' to ground the story in visible objects.\n"
    "- Call 'define_world_rule' for consistent story laws.\n\n"
    "Keep your [DIRECTOR] chatter separate from the [NARRATIVE] text."
)

def render_visual(asset_type: str, subject: str, visual_context: str) -> str:
    """
    Orders a visual asset that matches the current user-defined theme. Use this to visualize key story elements.

    Args:
        asset_type: Must strictly be one of: STILL_IMAGE, CINEMAGRAPH, or DIAGRAM. Do not guess any other value.
        subject: The precise action/item/character to be drawn. E.g. 'A cracked viewport with stars'. Make it highly descriptive. Do not hallucinate elements the user hasn't introduced.
        visual_context: Style/Vibe context based on the user's brief (e.g., 'Murky, blue, bioluminescent highlights').
    """
    return "Visual rendering requested."

def ambient_audio(preset: str, vibe_description: str) -> str:
    """
    Sets the sonic mood based on the user's input or story progression.

    Args:
        preset: Must be a valid preset from the list exactly: ominous, airy, tech, nature, custom. Do not invent an audio preset.
        vibe_description: Detailed description of the soundscape (e.g., 'Low thrumming of engines, distant whale song').
    """
    return "Audio preset changed."

def define_world_rule(rule_name: str, description: str, consequence: str) -> str:
    """
    Hard-fixes a law of physics/logic for the session based on the user's environment or story needs.

    Args:
        rule_name: Short name for the rule (e.g., 'Underwater Physics', 'Low Gravity').
        description: Explanation of the rule.
        consequence: How this rule affects the user or story.
    """
    return f"Rule {rule_name} established."

def segment_story(title: str) -> str:
    """
    Call this when the current story arc ends or the user changes the topic significantly. It creates a visual break (like a new chapter or horizontal rule) to separate the new content from the old.

    Args:
        title: The exact title text you want displayed (e.g. 'Chapter 2: The Deep Ocean'). Keep it short and dramatic.
    """
    return f"Story segmented with title {title}."

# ---------------------------------------------------------
# IT ARCHITECTURE MODE
# ---------------------------------------------------------
IT_ARCHITECTURE_SYSTEM_INSTRUCTION = (
    "You are an expert IT Solution Architect. Your goal is to help the user design and visualize IT systems, software "
    "architectures, and cloud infrastructure.\n"
    "You have access to a live interactive canvas where you can draw diagrams piece-by-piece.\n\n"
    "When the user asks for a specific architecture or design:\n"
    "1. PRIORITIZE DRAWING. Immediately call the drawing tools to visualize the request.\n"
    "2. Verbally explain the architecture and your design choices while drawing.\n"
    "3. If starting a brand new design, call 'clear_diagram' first.\n"
    "4. Call 'add_node' for architecture components. Space them out clearly.\n"
    "5. Call 'add_edge' for connections.\n\n"
    "Layout Guidelines:\n"
    "- Place the 'Internet' or client devices at the top (y=0).\n"
    "- Place Load Balancers or Gateway layers below that (y=150).\n"
    "- Place Application Servers below that (y=300).\n"
    "- Place Databases or Storage at the bottom (y=450).\n"
    "- Space nodes horizontally (x axis) by at least 300 units (e.g., x=0, x=300, x=600).\n"
    "- NEVER place nodes on top of each other. Ensure clear visual separation.\n\n"
    "Node Types available:\n"
    "- server, database, cloud, internet, mobile, laptop, compute, storage, network\n\n"
    "If you are interrupted and resume, check if you were mid-way through a diagram and complete the missing pieces.\n"
    "CRITICAL: Never announce or narrate your tool calls in speech. Execute add_node, add_edge, and clear_diagram silently. "
    "Simply describe what you are building architecturally while the tools draw it."
)

def clear_diagram() -> str:
    """
    Clears the current architecture diagram. Use this before starting a new fresh design.
    """
    return "Architecture diagram cleared."

def add_node(id: str, type: str, label: str, x: float, y: float) -> str:
    """
    Adds a new node (e.g., server, database, cloud) to the architecture diagram.

    Args:
        id: Unique identifier for this node, e.g. 'web-server-1'
        type: Must be one of: server, database, cloud, internet, mobile, laptop, compute, storage, network.
        label: Human readable label, e.g. 'API Gateway'
        x: Horizontal position. Space nodes out by at least 250 units.
        y: Vertical position. 0=Internet, 150=Gateway, 300=Application, 450=Database.
    """
    return f"Node {id} added."

def add_edge(id: str, source: str, target: str, label: str = "") -> str:
    """
    Adds a connection line between two nodes in the diagram.

    Args:
        id: Unique identifier for this edge, e.g. 'edge-web-db'
        source: The ID of the source node
        target: The ID of the target node
        label: Optional text on the arrow, e.g. 'HTTPS', 'TCP'
    """
    return f"Edge {id} added."

# Tool Mappings
SPATIAL_TOOLS = [track_and_highlight]
DIRECTOR_TOOLS = [render_visual, define_world_rule, segment_story]
IT_ARCHITECTURE_TOOLS = [clear_diagram, add_node, add_edge]
