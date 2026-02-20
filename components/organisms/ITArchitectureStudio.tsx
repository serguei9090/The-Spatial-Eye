"use client";

import { ArchitectureNode } from "@/components/atoms/ArchitectureNode";
import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
  architecture: ArchitectureNode,
};

interface ITArchitectureStudioProps {
  readonly nodes: Node[];
  readonly edges: Edge[];
  readonly onNodesChange: OnNodesChange;
  readonly onEdgesChange: OnEdgesChange;
  readonly onConnect: OnConnect;
}

export function ITArchitectureStudio({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: ITArchitectureStudioProps) {
  // `transcript` prop can be removed from type later if desired, but
  // keeping it harmless for now. The global overlay handles the display.

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Main Canvas */}
      <div className="flex-1 w-full h-full">
        <div className="w-full h-full bg-background border rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/10"
            colorMode="dark"
          >
            <Background />
            <Controls />
            <MiniMap zoomable pannable />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
