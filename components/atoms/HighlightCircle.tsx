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
  const commonProps = {
    animate: { opacity: [0.8, 1, 0.8] },
    transition: { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const },
    stroke: "#15ff81",
    strokeWidth: 3,
    fill: "rgba(21,255,129,0.14)",
    "data-testid": `highlight-${type}-${id}`,
  };

  if (type === "circle") {
    return <motion.circle cx={geometry.cx} cy={geometry.cy} r={geometry.radius} {...commonProps} />;
  }

  if (type === "fitted-circle") {
    return (
      <motion.circle cx={geometry.cx} cy={geometry.cy} r={geometry.fittedRadius} {...commonProps} />
    );
  }

  // Rounded Rect
  return (
    <motion.rect
      x={geometry.x}
      y={geometry.y}
      width={geometry.width}
      height={geometry.height}
      rx={12} // Smooth corners
      {...commonProps}
    />
  );
}
