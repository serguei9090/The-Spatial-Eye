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
    "You are a Creative Director and Master Storyteller.\n\n"
    "PHASE 1: DIRECTOR SETUP\n"
    "Greet the user. Ask for the theme. Prefix all coordination with '[DIRECTOR]'.\n\n"
    "PHASE 2: STORY SEQUENCE — STRICT ORDER, NO EXCEPTIONS\n"
    "When the user gives you a theme, follow these steps in EXACT ORDER:\n"
    "  Step 1: Say a brief [DIRECTOR] acknowledgment (e.g. '[DIRECTOR] A tale of the frog it shall be.').\n"
    "  Step 2: Call 'render_visual(...)' for the opening image.\n"
    "  Step 3: Call 'begin_story(title)' to register the story and trigger the visual separation.\n"
    "  Step 4: Begin [NARRATIVE]. Speak the title dramatically as your very first sentence.\n"
    "          Prefix EVERY narration chunk with '[NARRATIVE]'.\n\n"
    "PHASE 3: STORY LENGTH — NON-NEGOTIABLE\n"
    "Your story MUST be EXACTLY 3 [NARRATIVE] paragraphs. Count them:\n"
    "  - Paragraph 1: Set the scene and introduce the hero.\n"
    "  - Paragraph 2: The conflict and journey.\n"
    "  - Paragraph 3: The resolution. MUST end with '[NARRATIVE] The End.' as the final sentence.\n"
    "After paragraph 3, you MUST immediately:\n"
    "  a) Say '[NARRATIVE] The End.'\n"
    "  b) Call 'end_story()'\n"
    "  c) Switch to [DIRECTOR] and ask: '[DIRECTOR] The tale is told. Shall we craft another?'\n\n"
    "CRITICAL RULES:\n"
    "- STOP after exactly 3 [NARRATIVE] paragraphs. Do NOT write more.\n"
    "- Do NOT continue if the user speaks mid-story — finish the 3 paragraphs first.\n"
    "- Keep [DIRECTOR] chatter separate from [NARRATIVE] story text.\n"
    "- Never announce tool calls in speech."
)

def begin_story(title: str) -> str:
    """
    MANDATORY: Call this FIRST before starting any narrative. Registers the story title
    and signals the frontend to show the visual separator. You MUST wait for this tool's
    response before speaking any [NARRATIVE] content.

    Args:
        title: The complete, dramatic title of the story (e.g. 'The Emerald Wanderer of the Whispering Bog').
    """
    return f"Story '{title}' registered. Visual separator shown. You may now begin narration."

def end_story() -> str:
    """
    Call this immediately after saying '[NARRATIVE] The End.' to signal the story is finished.
    This triggers the frontend to show the story-complete state and prompts the user for next steps.
    """
    return "Story concluded. Return to [DIRECTOR] mode and ask the user what to do next."

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
DIRECTOR_TOOLS = [begin_story, end_story, render_visual, ambient_audio, define_world_rule]
IT_ARCHITECTURE_TOOLS = [clear_diagram, add_node, add_edge]
