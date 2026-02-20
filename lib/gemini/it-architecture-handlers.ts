import { type LiveServerMessage, type Tool, Type } from "@google/genai";
import type { Edge, Node } from "@xyflow/react";
import type { Dispatch, SetStateAction } from "react";

export const IT_ARCHITECTURE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "update_diagram",
        description:
          "Updates the IT architecture diagram with new nodes and edges. Use this to create or modify the system design.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique ID for the node" },
                  type: {
                    type: Type.STRING,
                    description:
                      "Node type: server, database, cloud, internet, mobile, laptop, compute, storage, network",
                    enum: [
                      "server",
                      "database",
                      "cloud",
                      "internet",
                      "mobile",
                      "laptop",
                      "compute",
                      "storage",
                      "network",
                    ],
                  },
                  label: { type: Type.STRING, description: "Label for the node" },
                  x: { type: Type.NUMBER, description: "X position on canvas" },
                  y: { type: Type.NUMBER, description: "Y position on canvas" },
                  status: {
                    type: Type.STRING,
                    enum: ["active", "inactive", "warning", "error"],
                    description: "Current status of the component",
                  },
                },
                required: ["id", "type", "label", "x", "y"],
              },
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique ID for the edge" },
                  source: { type: Type.STRING, description: "ID of the source node" },
                  target: { type: Type.STRING, description: "ID of the target node" },
                  label: { type: Type.STRING, description: "Label for the connection" },
                },
                required: ["id", "source", "target"],
              },
            },
          },
          required: ["nodes", "edges"],
        },
      },
    ],
  },
];

export const IT_ARCHITECTURE_SYSTEM_INSTRUCTION = `
You are an expert IT Solution Architect. Your goal is to help the user design and visualize IT systems, software architectures, and cloud infrastructure.
You have access to a live interactive canvas where you can draw diagrams.

When the user asks for a specific architecture (e.g., "3-tier web app on AWS"):
1.  Verbally explain the architecture and your design choices.
2.  SIMULTANEOUSLY call the 'update_diagram' tool to visualize it.
3.  Use the 'update_diagram' tool to modify the diagram as the conversation evolves.

Layout Guidelines:
- Place the 'Internet' or client devices at the top (y=0).
- Place Load Balancers or Gateway layers below that (y=150).
- Place Application Servers below that (y=300).
- Place Databases or Storage at the bottom (y=450).
- Space nodes horizontally by at least 200 units.

Node Types available:
- server (Generic servers, VMs)
- database (SQL, NoSQL, Storage)
- cloud (Cloud provider, generic cloud)
- internet (Global network, external)
- mobile (Mobile devices)
- laptop (Desktop/Laptop clients)
- compute (Functions, processing units)
- storage (Object storage, disks)
- network (Switches, routers, firewalls)

Always enable the diagram tool update. Do not just describe it textually if a visual is requested or helpful.
`;

interface UpdateDiagramArgs {
  nodes?: {
    id: string;
    type:
      | "server"
      | "database"
      | "cloud"
      | "internet"
      | "mobile"
      | "laptop"
      | "compute"
      | "storage"
      | "network";
    label: string;
    x: number;
    y: number;
    status?: "active" | "inactive" | "warning" | "error";
  }[];
  edges?: {
    id: string;
    source: string;
    target: string;
    label?: string;
  }[];
}

export function handleArchitectureToolCall(
  toolCall: LiveServerMessage["toolCall"],
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
) {
  if (!toolCall?.functionCalls) return;

  for (const fc of toolCall.functionCalls) {
    if (fc.name === "update_diagram") {
      const args = fc.args as unknown as UpdateDiagramArgs;
      const { nodes, edges } = args;

      if (Array.isArray(nodes)) {
        const newNodes: Node[] = nodes.map((n) => ({
          id: n.id,
          type: "architecture", // Use our custom node type
          position: { x: n.x, y: n.y },
          data: {
            label: n.label,
            type: n.type,
            status: n.status || "active",
          },
        }));
        setNodes(newNodes);
      }

      if (Array.isArray(edges)) {
        const newEdges: Edge[] = edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: "default",
          animated: true,
        }));
        setEdges(newEdges);
      }
    }
  }
}
