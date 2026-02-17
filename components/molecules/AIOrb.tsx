"use client";

import { motion } from "framer-motion";

interface AIOrbProps {
  isActive: boolean;
}

export function AIOrb({ isActive }: AIOrbProps) {
  return (
    <motion.div
      className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400"
      animate={{
        scale: isActive ? [1, 1.08, 1] : 1,
        opacity: isActive ? [0.85, 1, 0.85] : 0.45,
      }}
      transition={{ repeat: isActive ? Infinity : 0, duration: 1.4, ease: "easeInOut" }}
      aria-label={isActive ? "AI active" : "AI idle"}
    />
  );
}
