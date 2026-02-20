"use client";

import { motion } from "framer-motion";

interface HighlightCircleProps {
  id: string;
  cx: number;
  cy: number;
  radius: number;
}

export function HighlightCircle({ id, cx, cy, radius }: HighlightCircleProps) {
  if (radius <= 0) {
    return null;
  }

  return (
    <motion.circle
      data-testid={`highlight-circle-${id}`}
      cx={cx}
      cy={cy}
      r={radius}
      stroke="#15ff81"
      strokeWidth={3}
      fill="rgba(21,255,129,0.14)"
      animate={{ opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    />
  );
}
