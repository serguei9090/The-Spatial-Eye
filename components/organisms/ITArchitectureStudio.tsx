"use client";

import { ArchitectureNode } from "@/components/atoms/ArchitectureNode";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
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
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { Expand, Shrink } from "lucide-react";
import { useEffect, useState } from "react";
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
  readonly shouldFitView?: number; // Counter to trigger fitView
}

export function ITArchitectureStudio({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  shouldFitView = 0,
}: ITArchitectureStudioProps) {
  const { fitView } = useReactFlow();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (shouldFitView > 0) {
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
    }
  }, [shouldFitView, fitView]);

  return (
    <div
      className={cn(
        "relative h-full w-full flex flex-col transition-all duration-300",
        isFullScreen && "fixed inset-0 z-[100] bg-background p-4",
      )}
    >
      {/* Full Screen Toggle Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg border border-white/10 backdrop-blur-md bg-black/40 hover:bg-black/60"
          onClick={() => setIsFullScreen(!isFullScreen)}
        >
          {isFullScreen ? (
            <Shrink className="h-4 w-4 text-white" />
          ) : (
            <Expand className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 w-full h-full">
        <div className="w-full h-full bg-background border rounded-lg overflow-hidden relative shadow-2xl">
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

// Wrapper to provide ReactFlowContext
export function ITArchitectureStudioWrapper(props: ITArchitectureStudioProps) {
  return (
    <ReactFlowProvider>
      <ITArchitectureStudio {...props} />
    </ReactFlowProvider>
  );
}
