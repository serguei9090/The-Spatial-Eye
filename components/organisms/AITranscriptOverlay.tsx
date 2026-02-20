"use client";

import { useSettings } from "@/lib/store/settings-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Maximize2, MessageSquare, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface AITranscriptOverlayProps {
  readonly transcript?: string;
}

export function AITranscriptOverlay({ transcript }: AITranscriptOverlayProps) {
  const { t } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isCollapsed]);

  if (!transcript) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      className={cn(
        "absolute top-20 left-4 z-50 transition-all duration-300 pointer-events-auto",
        isMaximized ? "w-96" : "w-80",
      )}
    >
      <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header — Draggable area */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30 cursor-grab active:cursor-grabbing select-none">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t.status.aiAssistant}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded-md hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized((m) => !m);
                if (isCollapsed) setIsCollapsed(false);
              }}
              aria-label={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              className="p-1 rounded-md hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed((c) => !c);
              }}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable body — hidden when collapsed */}
        {!isCollapsed && (
          <div
            ref={scrollRef}
            className={cn(
              "overflow-y-auto px-4 py-3 bg-background/50",
              // Use manual cross-browser scrollbar hiding (like CreativeStudio)
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
              isMaximized ? "max-h-[60vh]" : "max-h-[240px]",
            )}
          >
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {transcript}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
