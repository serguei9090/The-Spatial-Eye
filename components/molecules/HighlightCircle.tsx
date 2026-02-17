"use client";

import { motion } from "framer-motion";

import type { Highlight } from "@/lib/types";
import { highlightToCircle } from "@/lib/utils/coordinates";

interface HighlightCircleProps {
  highlight: Highlight;
  videoWidth: number;
  videoHeight: number;
}

export function HighlightCircle({ highlight, videoWidth, videoHeight }: HighlightCircleProps) {
  const circle = highlightToCircle(highlight, videoWidth, videoHeight);

  if (circle.radius <= 0) {
    return null;
  }

  return (
    <motion.circle
      data-testid={`highlight-circle-${highlight.id}`}
      cx={circle.cx}
      cy={circle.cy}
      r={circle.radius}
      stroke="#15ff81"
      strokeWidth={3}
      fill="rgba(21,255,129,0.14)"
      animate={{ opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
