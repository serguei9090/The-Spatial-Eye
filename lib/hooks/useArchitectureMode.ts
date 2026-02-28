"use client";

import { handleArchitectureToolCall } from "@/lib/gemini/it-architecture-handlers";
import type { LiveServerMessage } from "@google/genai";
import type { Edge, Node } from "@xyflow/react";
import { useState } from "react";

export function useArchitectureMode() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const handleToolCall = (toolCall: LiveServerMessage["toolCall"]) => {
    handleArchitectureToolCall(toolCall, setNodes, setEdges);
  };

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    handleArchitectureToolCall: handleToolCall,
  };
}
