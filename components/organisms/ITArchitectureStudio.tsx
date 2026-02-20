"use client";

import { ITArchitectureCanvas } from "@/components/organisms/ITArchitectureCanvas";
import { useSettings } from "@/lib/store/settings-context";
import { cn } from "@/lib/utils";
import type { Edge, Node, OnConnect, OnEdgesChange, OnNodesChange } from "@xyflow/react";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useRef, useState } from "react";

interface ITArchitectureStudioProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  transcript?: string;
}

export function ITArchitectureStudio({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  transcript,
}: ITArchitectureStudioProps) {
  const { t } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* AI Transcript Overlay */}
      {transcript && (
        <div
          className={cn(
            "absolute top-4 left-4 z-20 w-80 transition-all duration-200",
            // Only capture pointer events when hovered so canvas works normally
            isHovered ? "pointer-events-auto" : "pointer-events-none",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="bg-card/90 backdrop-blur-md rounded-lg border border-border shadow-xl flex flex-col overflow-hidden">
            {/* Header — always visible, handles collapse toggle */}
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-primary/50 w-full text-left bg-transparent"
              onClick={() => setIsCollapsed((c) => !c)}
              aria-expanded={!isCollapsed}
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground flex-1">
                {t.status.aiAssistant}
              </span>
              {isCollapsed ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {/* Scrollable body — hidden when collapsed */}
            {!isCollapsed && (
              <div
                ref={scrollRef}
                className="overflow-y-auto px-4 py-3"
                style={{ maxHeight: "240px" }}
              >
                <p className="text-sm leading-relaxed text-foreground/90">{transcript}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 w-full h-full">
        <ITArchitectureCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />
      </div>
    </div>
  );
}
