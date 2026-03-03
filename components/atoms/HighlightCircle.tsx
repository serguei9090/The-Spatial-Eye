import { AI_VISION } from "@/lib/constants";
import type { HighlightType } from "@/lib/store/settings-context";
import { motion } from "framer-motion";

const IS_DIAGNOSTICS = AI_VISION.SPATIAL_DIAGNOSTICS;

interface HighlightCircleProps {
  readonly id: string;
  readonly label: string;
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

export function HighlightCircle({ id, label, type, geometry }: HighlightCircleProps) {
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

  // Label displayed below the highlight center
  const labelEl = (
    <text
      x={cx}
      y={cy + fittedRadius + 18}
      textAnchor="middle"
      fill="#15ff81"
      fontSize="13"
      fontWeight="600"
      fontFamily="monospace"
      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
      className="pointer-events-none select-none"
    >
      {label}
    </text>
  );

  // Only rendered when NEXT_PUBLIC_SPATIAL_DIAGNOSTICS=true
  const debugLayer = IS_DIAGNOSTICS ? (
    <g className="pointer-events-none opacity-100">
      {/* Exact bounding box */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="red"
        strokeWidth="3"
        fill="transparent"
      />
      {/* Exact Center Crosshair */}
      <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} stroke="red" strokeWidth="3" />
      <line x1={cx} y1={cy - 20} x2={cx} y2={cy + 20} stroke="red" strokeWidth="3" />
    </g>
  ) : null;

  if (type === "circle") {
    return (
      <>
        {debugLayer}
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
        {labelEl}
      </>
    );
  }

  if (type === "fitted-circle") {
    return (
      <>
        {debugLayer}
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
        {labelEl}
      </>
    );
  }

  // Rounded Rect
  return (
    <>
      {debugLayer}
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
      {labelEl}
    </>
  );
}
