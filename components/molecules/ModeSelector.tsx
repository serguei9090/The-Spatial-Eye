"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, Video } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export type AppMode = "live" | "studio";

interface ModeSelectorProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ mode, onChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex items-center rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onChange("live")}
        disabled={disabled}
        className={cn(
          "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          mode === "live" ? "text-black" : "text-white/70 hover:text-white",
        )}
      >
        {mode === "live" && (
          <motion.div
            layoutId="mode-highlight"
            className="absolute inset-0 rounded-full bg-white"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Video className="h-4 w-4" />
          Live
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange("studio")}
        disabled={disabled}
        className={cn(
          "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          mode === "studio" ? "text-black" : "text-white/70 hover:text-white",
        )}
      >
        {mode === "studio" && (
          <motion.div
            layoutId="mode-highlight"
            className="absolute inset-0 rounded-full bg-white"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Storyteller
        </span>
      </button>
    </div>
  );
}
