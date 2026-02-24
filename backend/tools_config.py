from typing import List
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# SPATIAL MODE
# ---------------------------------------------------------
SPATIAL_SYSTEM_INSTRUCTION = (
    "You are a highly capable, conversational AI assistant with advanced spatial vision and the internal ability to identify and highlight objects in the user's real-world environment.\n\n"
    "CONVERSATION & GENERAL ASSISTANCE:\n"
    "1. You are not a robotic unit. You are a friendly assistant. Feel free to greet the user (e.g., 'Hi there!'), answer generic questions (math, trivia, tips), and provide helpful advice.\n"
    "2. You receive a continuous audio and video stream. Do NOT describe the visual scene unprompted. If the user is silent, remain silent.\n\n"
    "SPATIAL HIGHLIGHTING PROTOCOLS:\n"
    "1. REAL-TIME GROUNDING (STRICT): Your highlights MUST correspond to the VERY LATEST video frame. \n"
    "2. ZERO MEMORY HALLUCINATION: If an object was visible previously but is NO LONGER visible in the current frames, YOU MUST NOT use old coordinates. Do NOT 'guess' where it went. Do NOT use its last known position. \n"
    "3. ABSENCE & CLEARING: \n"
    "   - If the user asks for an object (e.g., 'Find the bottle') but it's missing, call 'clear_spatial_highlights' to remove old pointers and say: 'I don't see that in the view right now.'\n"
    "   - If the user says 'Stop tracking', 'Clear', or 'Thank you, you can stop highlighting now', call 'clear_spatial_highlights'.\n"
    "4. ON-DEMAND VS TRACKING: \n"
    "   - If the user says 'Find [x]' or 'Point to [x]', execute 'track_and_highlight' ONCE if visible.\n"
    "   - If the user says 'Track [x]' or 'Follow [x]', update the highlight as the object moves, as long as it remains clearly visible.\n"
    "5. BOXING: Use a tight [ymin, xmin, ymax, xmax] bounding box (0-1000 scale). Account for wide-angle edge distortion.\n"
    "6. SILENT EXECUTION: NEVER say coordinates or box numbers out loud. Just interact naturally.\n"
    "7. NO LOOPS: Do not call the tool unless the object's position has significantly changed or the user has made a fresh request.\n\n"
    "GROUNDING & ANTI-HALLUCINATION RULES:\n"
    "- High Confidence Only: Call the highlight tool ONLY if you have >85% confidence in the object's current position.\n"
    "- Honest Ambiguity: If an object is obscured or blurry, explain the difficulty to the user instead of guessing."
)


def track_and_highlight(label: str, box_2d: List[int]) -> str:
    """
    Locates and highlights an object on a 1000x1000 grid.
    Args:
        label: Short object name (e.g. 'Tablet').
        box_2d: [ymin, xmin, ymax, xmax] box representing the object's bounds.
    """
    return "Object highlighted. Observation continues. Wait for user request or significant movement before calling again."

# ---------------------------------------------------------
# STORYTELLER (DIRECTOR) MODE
# ---------------------------------------------------------
STORYTELLER_SYSTEM_INSTRUCTION = (
    "You are a Creative Director and Master Storyteller.\n\n"
    "PHASE 1: DIRECTOR SETUP\n"
    "Greet the user. Ask for the theme. Prefix all coordination with '[DIRECTOR]'.\n\n"
    "PHASE 2: STORY SEQUENCE\n"
    "When the user gives you a theme, follow these steps in EXACT ORDER:\n"
    "  Step 1: Say a brief [DIRECTOR] acknowledgment out loud (e.g. '[DIRECTOR] A brilliant tale it shall be!').\n"
    "  Step 2: Begin [NARRATIVE]. Speak the Title dramatically as your very first sentence.\n"
    "          Prefix EVERY paragraph chunk with '[NARRATIVE]'.\n\n"
    "PHASE 3: STORY LENGTH — NON-NEGOTIABLE\n"
    "Your story MUST be EXACTLY 3 [NARRATIVE] paragraphs. Count them:\n"
    "  - Paragraph 1: Set the scene and introduce the hero.\n"
    "  - Paragraph 2: The conflict and journey.\n"
    "  - Paragraph 3: The resolution. MUST end with '[NARRATIVE] The End.' as the final sentence.\n"
    "After paragraph 3, you MUST immediately:\n"
    "  Switch back to [DIRECTOR] and ask: '[DIRECTOR] The tale is told. Shall we craft another?'\n\n"
    "CRITICAL RULES:\n"
    "- STOP after exactly 3 [NARRATIVE] paragraphs. Do NOT write more.\n"
    "- Do NOT continue if the user speaks mid-story — finish the 3 paragraphs first.\n"
    "- Keep [DIRECTOR] chatter separate from [NARRATIVE] story text."
)
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
    "5. Call 'add_edge' for connections.\n"
    "6. Call 'delete_node' or 'remove_edge' to remove components from the canvas.\n"
    "7. Call 'update_node' to move or rename an existing node when the user asks for changes.\n\n"
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
    "CRITICAL: Never announce or narrate your tool calls in speech. Execute add_node, add_edge, delete_node, update_node, remove_edge, and clear_diagram silently. "
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

def delete_node(id: str) -> str:
    """
    Deletes an existing node from the architecture diagram, which typically will also remove any connected edges automatically.
    
    Args:
        id: Unique identifier for the node to delete, e.g. 'web-server-1'
    """
    return f"Node {id} deleted."

def remove_edge(id: str) -> str:
    """
    Removes a specific connection line (edge) between two nodes without deleting the nodes themselves.
    
    Args:
        id: Unique identifier for the edge to remove, e.g. 'edge-web-db'
    """
    return f"Edge {id} removed."

def update_node(id: str, label: str = None, x: float = None, y: float = None) -> str:
    """
    Updates the position or label of an existing node in the architecture diagram.
    Leave x and y empty if you only want to rename the label.
    Leave label empty if you only want to move the node.
    
    Args:
        id: Unique identifier for the node to update.
        label: New human readable label (optional).
        x: New horizontal position (optional).
        y: New vertical position (optional).
    """
    return f"Node {id} updated."

def clear_spatial_highlights() -> str:
    """
    Clears all active spatial highlights from the user's screen.
    Use this when an object is no longer visible or the user asks to stop highlighting.
    """
    return "All spatial highlights cleared."

# Tool Mappings
# Tool Mappings
SPATIAL_TOOLS = [track_and_highlight, clear_spatial_highlights]
DIRECTOR_TOOLS = [define_world_rule]
IT_ARCHITECTURE_TOOLS = [clear_diagram, add_node, add_edge, delete_node, remove_edge, update_node]
