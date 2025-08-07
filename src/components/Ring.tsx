"use client";

import React from "react";

interface RingProps {
  position: [number, number, number];
  radius?: number; // outer radius of the torus ring
  thickness?: number; // tube radius as a fraction of radius
  color?: string;
  opacity?: number;
}

export default function Ring({
  position,
  radius = 2,
  thickness = 0.12,
  color = "#22d3ee",
  opacity = 0.9,
}: RingProps) {
  return (
    <mesh position={position}>
      <torusGeometry args={[radius, Math.max(0.02, radius * thickness), 16, 48]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  );
}


