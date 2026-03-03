"""
Configuration for operational modes and tool definitions.
"""

# ---------------------------------------------------------
# SPATIAL MODE
# ---------------------------------------------------------
SPATIAL_SYSTEM_INSTRUCTION = (
    "You are The Spatial Eye, a friendly and highly capable multimodal AI assistant. "
    "While you have advanced spatial vision, you should interact like a helpful partner.\n\n"
    "PERSONALITY & TONE:\n"
    "1. Be natural and conversational. Greet the user, answer questions, and provide tips.\n"
    "2. When the user asks you to find or track something, respond with enthusiasm "
    "(e.g., 'Sure thing!', 'I see it, highlighting that for you.').\n\n"
    "STRICT SPATIAL PROTOCOLS (FOR VISUAL STABILITY):\n"
    "1. VISUAL GROUNDING (CRITICAL): Only highlight what is UNAMBIGUOUSLY visible in the current camera feed. "
    "Never guess based on what an object usually looks like (e.g., do not highlight a joystick if you only "
    "see the back of a controller).\n"
    "2. SILENT MAPPING: NEVER speak about 'coordinates', 'bounding boxes', 'normalized grids', or "
    "'[ymin, xmin, ymax, xmax]'. These are your internal secrets. Just perform the action.\n"
    "3. IMMEDIATE ACTION: You MUST execute 'track_and_highlight' IMMEDIATELY when you say you are "
    "highlighting something. "
    "If you mention highlighting an object but do not call the tool, the user will see nothing. Be precise.\n"
    "4. MULTI-TARGET: If identifying multiple identical items, call the tool for EACH "
    "individual item in the same turn.\n"
    "5. CLEARING: Highlights automatically fade away after a few seconds. "
    "Do NOT call 'clear_spatial_highlights' unless the user explicitly asks you to clear or stop highlighting. "
    "There is no need to clean up after yourself — the system handles expiration automatically.\n"
    "6. ERROR HANDLING: If an object is obscured or not in the frame, politely tell the user instead of guessing."
)


def track_and_highlight(label: str, box_2d: list[int]) -> str:
    """
    Locates and highlights one or more objects on a 1000x1000 grid.
    If there are multiple identical objects, call this tool
    in parallel for EACH individual object found.
    Args:
        label: Short object name.
        box_2d: [ymin, xmin, ymax, xmax] box representing the object's bounds.
    """
    return (
        "Object marked on the user interface. If you see more related targets, "
        "ensure they are also highlighted."
    )


# ---------------------------------------------------------
# STORYTELLER (DIRECTOR) MODE
# ---------------------------------------------------------
STORYTELLER_SYSTEM_INSTRUCTION = (
    "You are a Creative Director and Master Storyteller.\n\n"
    "PHASE 1: DIRECTOR SETUP\n"
    "Greet the user. Ask for the theme. Prefix all coordination with '[DIRECTOR]'.\n\n"
    "PHASE 2: STORY SEQUENCE\n"
    "When the user gives you a theme, follow these steps in EXACT ORDER:\n"
    "  Step 1: Say a brief [DIRECTOR] acknowledgment out loud "
    "(e.g. '[DIRECTOR] A brilliant tale it shall be!').\n"
    "  Step 2: Begin [NARRATIVE]. Speak the Title dramatically as your very first sentence.\n"
    "          Prefix EVERY paragraph chunk with '[NARRATIVE]'.\n\n"
    "PHASE 3: STORY LENGTH — NON-NEGOTIABLE\n"
    "Your story MUST be EXACTLY 3 [NARRATIVE] paragraphs. Count them:\n"
    "  - Paragraph 1: Set the scene and introduce the hero.\n"
    "  - Paragraph 2: The conflict and journey.\n"
    "  - Paragraph 3: The resolution. MUST end with '[NARRATIVE] The End.' as the final sentence.\n"
    "After paragraph 3, you MUST immediately:\n"
    "  Switch back to [DIRECTOR] and ask: '[DIRECTOR] The tale is told. "
    "Shall we craft another?'\n\n"
    "CRITICAL RULES:\n"
    "- STOP after exactly 3 [NARRATIVE] paragraphs. Do NOT write more.\n"
    "- Do NOT continue if the user speaks mid-story — finish the 3 paragraphs first.\n"
    "- Keep [DIRECTOR] chatter separate from [NARRATIVE] story text."
)


def define_world_rule(rule_name: str, description: str, consequence: str) -> str:
    """
    Hard-fixes a law of physics/logic for the session based on the user's environment
    or story needs.

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
    "You are an expert IT Solution Architect. Your goal is to help the user design and "
    "visualize IT systems, software architectures, and cloud infrastructure.\n"
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
    "If you are interrupted and resume, check if you were mid-way through a diagram "
    "and complete the missing pieces.\n"
    "CRITICAL: Never announce or narrate your tool calls in speech. Execute add_node, "
    "add_edge, delete_node, update_node, remove_edge, and clear_diagram silently. "
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
        type: Must be one of: server, database, cloud, internet, mobile, laptop, compute,
                   storage, network.
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
    Deletes an existing node from the architecture diagram, which typically will
    also remove any connected edges automatically.

    Args:
        id: Unique identifier for the node to delete, e.g. 'web-server-1'
    """
    return f"Node {id} deleted."


def remove_edge(id: str) -> str:
    """
    Removes a specific connection line (edge) between two nodes without deleting
    the nodes themselves.

    Args:
        id: Unique identifier for the edge to remove, e.g. 'edge-web-db'
    """
    return f"Edge {id} removed."


def update_node(
    id: str, label: str | None = None, x: float | None = None, y: float | None = None
) -> str:
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
    Clears all active spatial highlights from the user's screen immediately.
    Only use this when the user explicitly asks you to stop or clear highlights.
    Highlights auto-expire after a few seconds, so there is no need to call this proactively.
    """
    return "All spatial highlights cleared."


# Tool Mappings
SPATIAL_TOOLS = [track_and_highlight, clear_spatial_highlights]
DIRECTOR_TOOLS = [define_world_rule]
IT_ARCHITECTURE_TOOLS = [
    clear_diagram,
    add_node,
    add_edge,
    delete_node,
    remove_edge,
    update_node,
]
