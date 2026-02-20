"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, Network, Video } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export type AppMode = "spatial" | "storyteller" | "it-architecture";

interface ModeSelectorProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ mode, onChange, disabled }: ModeSelectorProps) {
  const modes: { id: AppMode; label: string; icon: React.ElementType }[] = [
    { id: "spatial", label: "Live", icon: Video },
    { id: "storyteller", label: "Storyteller", icon: LayoutTemplate },
    { id: "it-architecture", label: "Architecture", icon: Network },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl border bg-background/50 p-1 backdrop-blur-md">
      {modes.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          disabled={disabled}
          className={cn(
            "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/10",
            mode === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {mode === item.id && (
            <motion.div
              layoutId="mode-highlight"
              className="absolute inset-0 rounded-lg bg-primary/20"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
