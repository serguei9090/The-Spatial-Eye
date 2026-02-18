"use client";

import { motion } from "framer-motion";

interface AIOrbProps {
  isActive: boolean;
  className?: string;
}

export function AIOrb({ isActive, className }: AIOrbProps) {
  return (
    <div className={className}>
      <motion.div
        className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
        animate={{
          scale: isActive ? [1, 1.1, 1] : 1,
          opacity: isActive ? [0.8, 1, 0.8] : 0.5,
          boxShadow: isActive
            ? ["0 0 15px rgba(52,211,153,0.5)", "0 0 25px rgba(52,211,153,0.8)", "0 0 15px rgba(52,211,153,0.5)"]
            : "0 0 5px rgba(52,211,153,0.2)",
        }}
        transition={{
          repeat: isActive ? Number.POSITIVE_INFINITY : 0,
          duration: 2,
          ease: "easeInOut",
        }}
        aria-label={isActive ? "AI active" : "AI idle"}
      />
    </div>
  );
}
