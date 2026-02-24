"use client";

import type React from "react";

interface SpatialGridProps {
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function SpatialGrid({
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
  scale,
  offsetX,
  offsetY,
}: SpatialGridProps) {
  // Generate grid lines for every 10% (100 units in 0-1000 range)
  const lines = [];
  for (let i = 0; i <= 10; i++) {
    const coord = i * 100;

    // Horizontal lines (Y constant)
    const yIntrinsic = (coord / 1000) * videoHeight;
    const yScreen = yIntrinsic * scale + offsetY;

    // Vertical lines (X constant)
    const xIntrinsic = (coord / 1000) * videoWidth;
    const xScreen = xIntrinsic * scale + offsetX;

    lines.push({ coord, xScreen, yScreen });
  }

  return (
    <g className="opacity-40">
      {/* Horizontal Lines */}
      {lines.map((line) => (
        <g key={`h-${line.coord}`}>
          <line
            x1={0}
            y1={line.yScreen}
            x2={containerWidth}
            y2={line.yScreen}
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          {line.coord % 200 === 0 && line.yScreen > 0 && line.yScreen < containerHeight && (
            <text x={10} y={line.yScreen - 5} fill="white" fontSize="10" className="font-mono">
              Y: {line.coord}
            </text>
          )}
        </g>
      ))}

      {/* Vertical Lines */}
      {lines.map((line) => (
        <g key={`v-${line.coord}`}>
          <line
            x1={line.xScreen}
            y1={0}
            x2={line.xScreen}
            y2={containerHeight}
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          {line.coord % 200 === 0 && line.xScreen > 0 && line.xScreen < containerWidth && (
            <text x={line.xScreen + 5} y={20} fill="white" fontSize="10" className="font-mono">
              X: {line.coord}
            </text>
          )}
        </g>
      ))}

      {/* Center crosshair */}
      <circle cx={containerWidth / 2} cy={containerHeight / 2} r="3" fill="red" opacity="0.5" />
    </g>
  );
}
