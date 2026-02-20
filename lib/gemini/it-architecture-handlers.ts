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
    ],
  },
];

export const IT_ARCHITECTURE_SYSTEM_INSTRUCTION = `
You are an expert IT Solution Architect. Your goal is to help the user design and visualize IT systems, software architectures, and cloud infrastructure.
You have access to a live interactive canvas where you can draw diagrams piece-by-piece.

When the user asks for a specific architecture or design:
1.  PRIORITIZE DRAWING. Immediately call the drawing tools to visualize the request.
2.  Verbally explain the architecture and your design choices while drawing.
3.  If starting a brand new design, call 'clear_diagram' first.
4.  Call 'add_node' for architecture components. Space them out clearly.
5.  Call 'add_edge' for connections.

Layout Guidelines:
- Place the 'Internet' or client devices at the top (y=0).
- Place Load Balancers or Gateway layers below that (y=150).
- Place Application Servers below that (y=300).
- Place Databases or Storage at the bottom (y=450).
- Space nodes horizontally (x axis) by at least 300 units (e.g., x=0, x=300, x=600).
- NEVER place nodes on top of each other. Ensure clear visual separation.

Node Types available:
- server, database, cloud, internet, mobile, laptop, compute, storage, network

If you are interrupted and resume, check if you were mid-way through a diagram and complete the missing pieces.
CRITICAL: Never announce or narrate your tool calls in speech. Execute add_node, add_edge, and clear_diagram silently. Simply describe what you are building architecturally while the tools draw it.
`;

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

export function handleArchitectureToolCall(
  toolCall: LiveServerMessage["toolCall"],
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
) {
  if (!toolCall?.functionCalls) return;

  for (const fc of toolCall.functionCalls) {
    if (fc.name === "clear_diagram") {
      console.log("[Architecture] Clearing diagram.");
      setNodes([]);
      setEdges([]);
      continue;
    }

    if (fc.name === "add_node") {
      const args = fc.args as unknown as AddNodeArgs;
      if (!args.id || !args.label) continue;

      const id = String(args.id).trim();
      const label = String(args.label).trim();
      const type = String(args.type || "server").trim();
      const x = Number(args.x) || 0;
      const y = Number(args.y) || 0;

      console.log("[Architecture] Adding node:", id);
      setNodes((prev) => {
        const filtered = prev.filter((n) => n.id !== id);

        // Simple Collision Management: if someone is already at (x, y), nudget it
        let finalX = x;
        let finalY = y;
        const exists = prev.find(
          (n) => n.id !== id && Math.abs(n.position.x - x) < 50 && Math.abs(n.position.y - y) < 50,
        );
        if (exists) {
          finalX += 50;
          finalY += 50;
        }

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
      continue;
    }

    if (fc.name === "add_edge") {
      const args = fc.args as unknown as AddEdgeArgs;
      if (!args.id || !args.source || !args.target) continue;

      const id = String(args.id).trim();
      const source = String(args.source).trim();
      const target = String(args.target).trim();
      const label = args.label ? String(args.label).trim() : undefined;

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
  }
}
