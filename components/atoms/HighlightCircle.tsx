import type { HighlightType } from "@/lib/store/settings-context";
import { motion } from "framer-motion";

interface HighlightCircleProps {
  readonly id: string;
  readonly type: HighlightType;
  readonly geometry: {
    readonly cx: number;
    readonly cy: number;
    readonly radius: number;
    readonly fittedRadius: number;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export function HighlightCircle({ id, type, geometry }: HighlightCircleProps) {
  // Defensive fallbacks — prevent "undefined" SVG attribute errors
  const cx = geometry.cx ?? 0;
  const cy = geometry.cy ?? 0;
  const radius = geometry.radius ?? 0;
  const fittedRadius = geometry.fittedRadius ?? 0;
  const x = geometry.x ?? 0;
  const y = geometry.y ?? 0;
  const width = geometry.width ?? 0;
  const height = geometry.height ?? 0;

  const commonProps = {
    transition: {
      opacity: { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const },
      // Smooth sliding/resizing transitions
      cx: { type: "spring", stiffness: 300, damping: 30 } as const,
      cy: { type: "spring", stiffness: 300, damping: 30 } as const,
      r: { type: "spring", stiffness: 300, damping: 30 } as const,
      x: { type: "spring", stiffness: 300, damping: 30 } as const,
      y: { type: "spring", stiffness: 300, damping: 30 } as const,
      width: { type: "spring", stiffness: 300, damping: 30 } as const,
      height: { type: "spring", stiffness: 300, damping: 30 } as const,
    },
    stroke: "#15ff81",
    strokeWidth: 3,
    fill: "rgba(21,255,129,0.14)",
    "data-testid": `highlight-${type}-${id}`,
  };

  if (type === "circle") {
    return (
      <motion.circle
        initial={{ cx, cy, r: radius, opacity: 0.8 }}
        animate={{
          cx,
          cy,
          r: radius,
          opacity: [0.8, 1, 0.8],
        }}
        {...commonProps}
      />
    );
  }

  if (type === "fitted-circle") {
    return (
      <motion.circle
        initial={{ cx, cy, r: fittedRadius, opacity: 0.8 }}
        animate={{
          cx,
          cy,
          r: fittedRadius,
          opacity: [0.8, 1, 0.8],
        }}
        {...commonProps}
      />
    );
  }

  // Rounded Rect
  return (
    <motion.rect
      initial={{ x, y, width, height, opacity: 0.8 }}
      animate={{
        x,
        y,
        width,
        height,
        opacity: [0.8, 1, 0.8],
      }}
      rx={12} // Smooth corners
      {...commonProps}
    />
  );
}
