import { type LiveServerMessage, type Tool, Type } from "@google/genai";
import type { Edge, Node } from "@xyflow/react";
import type { Dispatch, SetStateAction } from "react";

export const IT_ARCHITECTURE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "clear_diagram",
        description:
          "Clears the current architecture diagram. Use this before starting a new fresh design.",
      },
      {
        name: "add_node",
        description: "Adds a new node (e.g., server, database, cloud) to the architecture diagram.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "Unique identifier for this node, e.g. 'web-server-1'",
            },
            type: {
              type: Type.STRING,
              description:
                "Must be one of: server, database, cloud, internet, mobile, laptop, compute, storage, network.",
            },
            label: { type: Type.STRING, description: "Human readable label, e.g. 'API Gateway'" },
            x: {
              type: Type.NUMBER,
              description: "Horizontal position. Space nodes out by at least 250 units.",
            },
            y: {
              type: Type.NUMBER,
              description:
                "Vertical position. 0=Internet, 150=Gateway, 300=Application, 450=Database.",
            },
          },
          required: ["id", "type", "label", "x", "y"],
        },
      },
      {
        name: "add_edge",
        description: "Adds a connection line between two nodes in the diagram.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "Unique identifier for this edge, e.g. 'edge-web-db'",
            },
            source: { type: Type.STRING, description: "The ID of the source node" },
            target: { type: Type.STRING, description: "The ID of the target node" },
            label: {
              type: Type.STRING,
              description: "Optional text on the arrow, e.g. 'HTTPS', 'TCP'",
            },
          },
          required: ["id", "source", "target"],
        },
      },
      {
        name: "delete_node",
        description:
          "Deletes an existing node from the architecture diagram, which typically will also remove any connected edges automatically.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "Unique identifier for the node to delete, e.g. 'web-server-1'",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "remove_edge",
        description:
          "Removes a specific connection line (edge) between two nodes without deleting the nodes themselves.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "Unique identifier for the edge to remove, e.g. 'edge-web-db'",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "update_node",
        description:
          "Updates the position or label of an existing node in the architecture diagram. Leave x and y empty if you only want to rename the label. Leave label empty if you only want to move the node.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "Unique identifier for the node to update.",
            },
            label: { type: Type.STRING, description: "New human readable label (optional)." },
            x: { type: Type.NUMBER, description: "New horizontal position (optional)." },
            y: { type: Type.NUMBER, description: "New vertical position (optional)." },
          },
          required: ["id"],
        },
      },
    ],
  },
];

/**
 * NOTE: The actual system instruction is in backend/tools_config.py.
 * This frontend constant is only used as a mode label by useGeminiLive.
 */
export const IT_ARCHITECTURE_SYSTEM_INSTRUCTION = "it-architecture-mode";

interface AddNodeArgs {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
}

interface AddEdgeArgs {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface UpdateNodeArgs {
  id: string;
  label?: string;
  x?: number;
  y?: number;
}

/**
 * Iteratively find a position that does not collide with existing nodes.
 */
function findNonCollidingPosition(
  id: string,
  targetX: number,
  targetY: number,
  existingNodes: Node[],
  depth = 0,
): { x: number; y: number } {
  if (depth > 10) return { x: targetX, y: targetY }; // Safety break

  const COLLISION_THRESHOLD = 80;
  const NUDGE_STEP = 50;

  const collision = existingNodes.find(
    (n) =>
      n.id !== id &&
      Math.abs(n.position.x - targetX) < COLLISION_THRESHOLD &&
      Math.abs(n.position.y - targetY) < COLLISION_THRESHOLD,
  );

  if (collision) {
    // Nudge diagonally and retry
    return findNonCollidingPosition(
      id,
      targetX + NUDGE_STEP,
      targetY + NUDGE_STEP,
      existingNodes,
      depth + 1,
    );
  }

  return { x: targetX, y: targetY };
}

function processDeleteNode(
  args: { id: string },
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
) {
  if (!args.id) return;
  const id = String(args.id).trim();
  console.log("[Architecture] Deleting node:", id);
  setNodes((prev) => prev.filter((n) => n.id !== id));
  setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
}

function processRemoveEdge(args: { id: string }, setEdges: Dispatch<SetStateAction<Edge[]>>) {
  if (!args.id) return;
  const id = String(args.id).trim();
  console.log("[Architecture] Removing edge:", id);
  setEdges((prev) => prev.filter((e) => e.id !== id));
}

export function handleArchitectureToolCall(
  toolCall: LiveServerMessage["toolCall"],
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
) {
  if (!toolCall?.functionCalls) return;

  for (const fc of toolCall.functionCalls) {
    const name = fc.name;
    const args = fc.args;
    if (!args) continue;

    switch (name) {
      case "clear_diagram":
        console.log("[Architecture] Clearing diagram.");
        setNodes([]);
        setEdges([]);
        break;

      case "add_node":
        processAddNode(args as unknown as AddNodeArgs, setNodes);
        break;

      case "update_node":
        processUpdateNode(args as unknown as UpdateNodeArgs, setNodes);
        break;

      case "delete_node":
        processDeleteNode(args as { id: string }, setNodes, setEdges);
        break;

      case "remove_edge":
        processRemoveEdge(args as { id: string }, setEdges);
        break;

      case "add_edge":
        processAddEdge(args as unknown as AddEdgeArgs, setEdges, setNodes);
        break;

      default:
        console.warn(`[Architecture] Unknown tool call: ${name}`, args);
        break;
    }
  }
}

function processAddNode(args: AddNodeArgs, setNodes: Dispatch<SetStateAction<Node[]>>) {
  if (!args.id || !args.label) return;

  const id = String(args.id).trim();
  const label = String(args.label).trim();
  const type = String(args.type || "server").trim();
  const x = Number(args.x) || 0;
  const y = Number(args.y) || 0;

  console.log("[Architecture] Adding node:", id);
  setNodes((prev) => {
    const filtered = prev.filter((n) => n.id !== id);
    const { x: finalX, y: finalY } = findNonCollidingPosition(id, x, y, prev);

    const newNode: Node = {
      id,
      type: "architecture",
      position: { x: finalX, y: finalY },
      data: {
        label,
        type,
        status: "active",
      },
    };
    return [...filtered, newNode];
  });
}

function processUpdateNode(args: UpdateNodeArgs, setNodes: Dispatch<SetStateAction<Node[]>>) {
  if (!args.id) return;

  const id = String(args.id).trim();
  console.log("[Architecture] Updating node:", id);

  setNodes((prev) =>
    prev.map((node) => {
      if (node.id !== id) return node;

      const updatedNode = { ...node };
      if (args.label) updatedNode.data = { ...node.data, label: String(args.label).trim() };
      if (args.x !== undefined || args.y !== undefined) {
        updatedNode.position = {
          x: args.x === undefined ? node.position.x : Number(args.x),
          y: args.y === undefined ? node.position.y : Number(args.y),
        };
      }
      return updatedNode;
    }),
  );
}

function processAddEdge(
  args: AddEdgeArgs,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
  setNodes: Dispatch<SetStateAction<Node[]>>,
) {
  if (!args.id || !args.source || !args.target) return;

  const id = String(args.id).trim();
  const source = String(args.source).trim();
  const target = String(args.target).trim();
  const label = args.label ? String(args.label).trim() : undefined;

  // Both exist — add the edge
  const newEdge: Edge = {
    id,
    source,
    target,
    label,
    type: "default",
    animated: true,
  };

  console.log("[Architecture] Adding edge:", id);
  setEdges((prev) => {
    const filtered = prev.filter((e) => e.id !== id);
    return [...filtered, newEdge];
  });
}
