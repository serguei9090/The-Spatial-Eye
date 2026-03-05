"use client";

import type React from "react";

interface SpatialGridProps {
  readonly videoWidth: number;
  readonly videoHeight: number;
  readonly containerWidth: number;
  readonly containerHeight: number;
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
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
  // Prevent division by zero or NaN rendering
  if (!containerWidth || !containerHeight) return null;

  // Generate grid lines for every 10% (100 units in 0-1000 range)
  const lines = [];
  for (let i = 0; i <= 10; i++) {
    const coord = i * 100;

    // Coordinates are direct 0-1000 linear mapping to the sent frame dimensions
    const unpaddedY = coord;
    const unpaddedX = coord;

    // Horizontal lines (Y constant)
    const yIntrinsic = (unpaddedY / 1000) * videoHeight;
    const yScreen = yIntrinsic * scale + offsetY;

    // Vertical lines (X constant)
    const xIntrinsic = (unpaddedX / 1000) * videoWidth;
    const xScreen = xIntrinsic * scale + offsetX;

    lines.push({ coord, xScreen, yScreen });
  }

  return (
    <g className="opacity-100">
      {/* Horizontal Lines */}
      {lines.map((line) => (
        <g key={`h-${line.coord}`}>
          <line
            x1={0}
            y1={line.yScreen}
            x2={containerWidth}
            y2={line.yScreen}
            stroke="#15ff81"
            strokeWidth="1.5"
          />
          {line.coord % 100 === 0 &&
            line.yScreen > 0 &&
            line.yScreen < containerHeight && (
              <text
                x={10}
                y={line.yScreen - 5}
                fill="#15ff81"
                fontSize="12"
                className="font-mono font-bold"
                style={{ textShadow: "0 1px 3px black" }}
              >
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
            stroke="#15ff81"
            strokeWidth="1.5"
          />
          {line.coord % 100 === 0 &&
            line.xScreen > 0 &&
            line.xScreen < containerWidth && (
              <text
                x={line.xScreen + 5}
                y={20}
                fill="#15ff81"
                fontSize="12"
                className="font-mono font-bold"
                style={{ textShadow: "0 1px 3px black" }}
              >
                X: {line.coord}
              </text>
            )}
        </g>
      ))}

      {/* Center crosshair */}
      <circle
        cx={containerWidth / 2}
        cy={containerHeight / 2}
        r="6"
        fill="red"
        opacity="1"
      />
    </g>
  );
}
