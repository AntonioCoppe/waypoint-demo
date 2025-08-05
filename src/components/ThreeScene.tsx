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

const ARROW_SIZE = 60; // px
const MARGIN = 20;     // px inside the edge
const PAD   = ARROW_SIZE / 2 + MARGIN; // inset from each side

type IndicatorState = {
  pos: { x: number; y: number };
  rotation: number;
  off: boolean;
};

function Scene({ onUpdate }: { onUpdate(s: IndicatorState): void }) {
  const wpRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();

  const stars = useMemo(() => {
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

    // 1) Project
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

    // 2) On-screen?
    if (!isPositionOffScreen(scr, W, H)) {
      onUpdate({ pos: { x: scr.x, y: scr.y }, rotation: 0, off: false });
      return;
    }

    // 3) Ray from center → scr
    const dx = scr.x - cx;
    const dy = scr.y - cy;
    const angle = Math.atan2(dy, dx);

    // 4) Candidate intersections with the padded rectangle
    type Cand = { t: number; x: number; y: number };
    const cands: Cand[] = [];

    // Vertical edges
    if (dx !== 0) {
      const tRight = ((W - PAD) - cx) / dx;
      if (tRight > 0) {
        const y = cy + dy * tRight;
        if (y >= PAD && y <= H - PAD) cands.push({ t: tRight, x: W - PAD, y });
      }
      const tLeft = (PAD - cx) / dx;
      if (tLeft > 0) {
        const y = cy + dy * tLeft;
        if (y >= PAD && y <= H - PAD) cands.push({ t: tLeft, x: PAD, y });
      }
    }

    // Horizontal edges
    if (dy !== 0) {
      const tBot = ((H - PAD) - cy) / dy;
      if (tBot > 0) {
        const x = cx + dx * tBot;
        if (x >= PAD && x <= W - PAD) cands.push({ t: tBot, x, y: H - PAD });
      }
      const tTop = (PAD - cy) / dy;
      if (tTop > 0) {
        const x = cx + dx * tTop;
        if (x >= PAD && x <= W - PAD) cands.push({ t: tTop, x, y: PAD });
      }
    }

    // 5) Pick the nearest intersection
    if (cands.length === 0) {
      // fallback to center
      onUpdate({ pos: { x: cx, y: cy }, rotation: angle, off: true });
    } else {
      const best = cands.reduce((a, b) => (a.t < b.t ? a : b));
      onUpdate({ pos: { x: best.x, y: best.y }, rotation: angle, off: true });
    }
  });

  return (
    <>
      {/* starfield */}
      <points geometry={stars}>
        <pointsMaterial attach="material" size={0.5} color="white" />
      </points>

      {/* waypoint */}
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
  const [ind, setInd] = useState<IndicatorState>({
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
        <Scene onUpdate={setInd} />
      </Canvas>

      {ind.off && (
        <WaypointIndicator position={ind.pos} rotation={ind.rotation} />
      )}
    </div>
  );
}
