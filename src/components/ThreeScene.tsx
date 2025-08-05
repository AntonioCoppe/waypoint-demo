// src/components/ThreeScene.tsx
"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { FlyControls } from "@react-three/drei";
import {
  Vector3,
  Mesh,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";

import {
  worldToScreenPosition,
  isPositionOffScreen,
  ScreenPosition,
} from "../utils/math";
import WaypointIndicator from "./WaypointIndicator";

const PAD = 20; // padding in px

type IndicatorState = {
  pos: { x: number; y: number };
  rotation: number;
  off: boolean;
};

function Scene({ onUpdate }: { onUpdate: (s: IndicatorState) => void }) {
  const wpRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();

  // build stars once
  const starsGeo = useMemo(() => {
    const N = 5000;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[3 * i + 0] = (Math.random() - 0.5) * 200;
      arr[3 * i + 1] = (Math.random() - 0.5) * 200;
      arr[3 * i + 2] = (Math.random() - 0.5) * 200;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!wpRef.current) return;

    // Project world→screen
    const worldPos = wpRef.current.position.clone();
    const W = gl.domElement.clientWidth;
    const H = gl.domElement.clientHeight;
    const cx = W / 2;
    const cy = H / 2;
    const scr = worldToScreenPosition(
      worldPos,
      camera.matrixWorldInverse,
      camera.projectionMatrix,
      W,
      H
    );

    // On‐screen?
    if (!isPositionOffScreen(scr, W, H)) {
      onUpdate({ pos: { x: scr.x, y: scr.y }, rotation: 0, off: false });
      return;
    }

    // Compute 2D ray from center → scr
    const dx = scr.x - cx;
    const dy = scr.y - cy;

    // New angle so up=−90°, down=+90°
    const angle = Math.atan2(dy, dx);

    // Find intersection with full-screen rect
    const tX = dx !== 0 ? cx / Math.abs(dx) : Infinity;
    const tY = dy !== 0 ? cy / Math.abs(dy) : Infinity;
    const t = Math.min(tX, tY);

    let arrowX = cx + dx * t;
    let arrowY = cy + dy * t;

    // Clamp into padded box
    arrowX = Math.min(Math.max(arrowX, PAD), W - PAD);
    arrowY = Math.min(Math.max(arrowY, PAD), H - PAD);

    onUpdate({ pos: { x: arrowX, y: arrowY }, rotation: angle, off: true });
  });

  return (
    <>
      <points geometry={starsGeo}>
        <pointsMaterial attach="material" size={0.5} color="white" />
      </points>

      <mesh ref={wpRef} position={[0, 0, -10]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
    </>
  );
}

export default function ThreeScene() {
  const [indicator, setIndicator] = useState<IndicatorState>({
    pos: { x: 0, y: 0 },
    rotation: 0,
    off: false,
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Canvas
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        camera={{ position: [0, 1, 5], fov: 75, near: 0.1, far: 500 }}
      >
        <FlyControls movementSpeed={10} rollSpeed={Math.PI / 24} dragToLook />
        <Scene onUpdate={setIndicator} />
      </Canvas>

      {indicator.off && (
        <WaypointIndicator
          position={indicator.pos}
          rotation={indicator.rotation}
        />
      )}
    </div>
  );
}
