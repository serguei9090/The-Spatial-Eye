"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ModernBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 80, 20, 0],
                y: [0, 40, -20, 0],
                scale: [1, 1.08, 0.96, 1],
              }
        }
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute right-[-6rem] top-[-3rem] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -70, -20, 0],
                y: [0, 50, 10, 0],
                scale: [1, 0.95, 1.1, 1],
              }
        }
        transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -40, 30, 0],
                y: [0, -40, -10, 0],
                scale: [1, 1.12, 0.94, 1],
              }
        }
        transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
    </div>
  );
}
