"use client";

import { AIErrorBoundary } from "@/components/atoms/AIErrorBoundary";
import { ITArchitectureStudioWrapper as ITArchitectureStudio } from "@/components/organisms/ITArchitectureStudio";
import { useStudioContext } from "@/lib/store/studio-context";

export function ArchitectureView() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    fitViewCounter,
  } = useStudioContext();

  return (
    <AIErrorBoundary key="it-architecture" label="IT Architecture Studio">
      <div className="relative h-screen w-full overflow-hidden flex flex-col pt-16 pb-24">
        {/* Main Architecture Interface */}
        <div className="flex-1 w-full h-full z-10">
          <ITArchitectureStudio
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            shouldFitView={fitViewCounter}
          />
        </div>
      </div>
    </AIErrorBoundary>
  );
}
