"use client";

import React from "react";

interface Props {
  position: { x: number; y: number };
  rotation: number;
  color?: string;
  label?: string;
}

export default function WaypointIndicator({ position, rotation, color = "#22d3ee", label }: Props) {
  const size = 60;  // matches ARROW_SIZE
  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        fontSize: `${size}px`,
        transform: `translate(-50%, -50%) rotate(${rotation}rad)`,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div style={{
        color,
        lineHeight: 1,
        textShadow: "0 0 6px rgba(0,0,0,0.6)",
      }}>
        ➤
      </div>
      {label && (
        <div style={{
          position: "absolute",
          top: size,
          left: "50%",
          transform: "translateX(-50%)",
          color,
          fontSize: "14px",
          fontWeight: 600,
          textShadow: "0 0 6px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}>
          {label}
        </div>
      )}
    </div>
  );
}
