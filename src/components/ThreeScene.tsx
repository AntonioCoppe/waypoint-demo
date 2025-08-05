"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Mesh,BufferGeometry,Float32BufferAttribute } from "three";

import CameraController from "./CameraController";
import IntroOverlay from "./IntroOverlay";
import WaypointIndicator from "./WaypointIndicator";

import {
  worldToScreenPosition,
  isPositionOffScreen,
} from "../utils/math";

// arrow & padding constants
const ARROW_SIZE = 60; // px
const MARGIN = 20;     // px inside the edge
const PAD = ARROW_SIZE / 2 + MARGIN; // inset from each side

type IndicatorState = {
  pos: { x: number; y: number };
  rotation: number;
  off: boolean;
};

function Scene({ onIndicatorUpdate }: { onIndicatorUpdate: (s: IndicatorState) => void }) {
  const wpRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();

  // starfield once
  const starsGeo = useMemo(() => {
    const N = 5000;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[3 * i]     = (Math.random() - 0.5) * 200;
      arr[3 * i + 1] = (Math.random() - 0.5) * 200;
      arr[3 * i + 2] = (Math.random() - 0.5) * 200;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!wpRef.current) return;

    // project waypoint
    const worldPos = wpRef.current.position.clone();
    const W = gl.domElement.clientWidth;
    const H = gl.domElement.clientHeight;
    const cx = W / 2;
    const cy = H / 2;
    const scr = worldToScreenPosition(
      worldPos,
      camera.matrixWorldInverse,
      camera.projectionMatrix,
      W, H
    );

    // on-screen?
    if (!isPositionOffScreen(scr, W, H)) {
      onIndicatorUpdate({ pos: { x: scr.x, y: scr.y }, rotation: 0, off: false });
      return;
    }

    // clamp to padded border
    const dx = scr.x - cx;
    const dy = scr.y - cy;
    const angle = Math.atan2(dy, dx);

    const scaleX = dx !== 0 ? (cx - PAD) / Math.abs(dx) : Infinity;
    const scaleY = dy !== 0 ? (cy - PAD) / Math.abs(dy) : Infinity;
    const s = Math.min(scaleX, scaleY);

    onIndicatorUpdate({
      pos: { x: cx + dx * s, y: cy + dy * s },
      rotation: angle,
      off: true,
    });
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
  const [showIntro, setShowIntro] = useState(true);

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
        <CameraController lookSpeed={1.5} moveSpeed={10} />
        <Scene onIndicatorUpdate={setIndicator} />
      </Canvas>

      {indicator.off && (
        <WaypointIndicator position={indicator.pos} rotation={indicator.rotation} />
      )}

      {showIntro && <IntroOverlay onStart={() => setShowIntro(false)} />}
    </div>
  );
}
