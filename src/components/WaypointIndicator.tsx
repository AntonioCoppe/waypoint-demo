"use client";

import React from "react";

interface Props {
  position: { x: number; y: number };
  rotation: number;
}

export default function WaypointIndicator({ position, rotation }: Props) {
  const size = 60; // arrow size in px
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
      ➤
    </div>
  );
}
