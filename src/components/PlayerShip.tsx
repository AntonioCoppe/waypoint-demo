"use client";

import React from "react";

interface PlayerShipProps {
  position: [number, number, number];
  rotationY: number;
}

export default function PlayerShip({ position, rotationY }: PlayerShipProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <coneGeometry args={[0.25, 0.8, 12]} />
        <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, -0.15, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <mesh position={[0.35, -0.05, -0.2]} rotation={[0, 0, -Math.PI / 8]}>
        <boxGeometry args={[0.4, 0.05, 0.15]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[-0.35, -0.05, -0.2]} rotation={[0, 0, Math.PI / 8]}>
        <boxGeometry args={[0.4, 0.05, 0.15]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}


