"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface AIOrbProps {
  isActive: boolean;
  isUserTalking?: boolean;
  isAiTalking?: boolean;
  className?: string;
}

export function AIOrb({
  isActive,
  isUserTalking = false,
  isAiTalking = false,
  className,
}: AIOrbProps) {
  // Color selection based on talking state
  const colors = {
    idle: {
      sphere: "from-cyan-500/10 to-emerald-500/10",
      liquid: "fill-cyan-500/20",
      glow: "shadow-[0_0_10px_rgba(34,211,238,0.2)]",
    },
    user: {
      sphere: "from-blue-600/40 to-cyan-400/40",
      liquid: "fill-blue-400/60",
      glow: "shadow-[0_0_20px_rgba(56,189,248,0.5)]",
    },
    ai: {
      sphere: "from-emerald-600/40 to-teal-400/40",
      liquid: "fill-emerald-400/60",
      glow: "shadow-[0_0_20px_rgba(52,211,153,0.5)]",
    },
  };

  const isTalking = isUserTalking || isAiTalking;
  const currentTheme = isUserTalking ? colors.user : isAiTalking ? colors.ai : colors.idle;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* External Halo Glow (Subtle) */}
      <AnimatePresence>
        {isTalking && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn(
              "absolute h-12 w-12 rounded-full blur-xl transition-colors duration-500",
              isUserTalking ? "bg-blue-500/20" : "bg-emerald-500/20",
            )}
          />
        )}
      </AnimatePresence>

      {/* Main Glass Sphere */}
      <div
        className={cn(
          "relative h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-black/40 backdrop-blur-md transition-all duration-500",
          currentTheme.glow,
        )}
      >
        {/* Background Ambient Glow */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-colors duration-500",
            currentTheme.sphere,
          )}
        />

        {/* The Liquid Container */}
        <motion.div
          animate={{
            y: isTalking ? "-10%" : "50%", // Rise when talking
          }}
          transition={{
            type: "spring",
            stiffness: 40,
            damping: 15,
          }}
          className="absolute inset-x-0 bottom-0 h-[120%] pointer-events-none"
        >
          {/* Wave Layer 1 */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className={cn(
              "absolute top-0 h-full w-[200%] transition-colors duration-500",
              currentTheme.liquid,
            )}
            style={{ left: "-50%" }}
          >
            <motion.path
              animate={{
                x: [0, -50],
              }}
              transition={{
                duration: isTalking ? 2 : 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              d="M0 20 C 20 10, 40 10, 50 20 C 60 30, 80 30, 100 20 L 100 100 L 0 100 Z"
            />
            <motion.path
              animate={{
                x: [0, -50],
              }}
              transition={{
                duration: isTalking ? 2 : 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              d="M100 20 C 120 10, 140 10, 150 20 C 160 30, 180 30, 200 20 L 200 100 L 100 100 Z"
            />
          </svg>

          {/* Wave Layer 2 (Slightly Offset and different opacity) */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className={cn(
              "absolute top-0 h-full w-[200%] opacity-40 transition-colors duration-500",
              currentTheme.liquid,
            )}
            style={{ left: "-50%", top: "5%" }}
          >
            <motion.path
              animate={{
                x: [-50, 0],
              }}
              transition={{
                duration: isTalking ? 3 : 6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              d="M0 20 C 20 30, 40 30, 50 20 C 60 10, 80 10, 100 20 L 100 100 L 0 100 Z"
            />
            <motion.path
              animate={{
                x: [-50, 0],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              d="M100 20 C 120 30, 140 30, 150 20 C 160 10, 180 10, 200 20 L 200 100 L 100 100 Z"
            />
          </svg>
        </motion.div>

        {/* Top Glint (Premium Reflection) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1 left-3 h-1.5 w-3 skew-x-[-20deg] rounded-full bg-white/30 blur-[1px] pointer-events-none" />
      </div>

      {/* Floating Center Core (Bioluminescence) */}
      <AnimatePresence>
        {isTalking && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={cn(
              "absolute h-1.5 w-1.5 rounded-full bg-white blur-[1px] shadow-[0_0_10px_white]",
              "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-white/50",
            )}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
