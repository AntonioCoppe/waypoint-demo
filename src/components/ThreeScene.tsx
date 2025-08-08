// src/components/ThreeScene.tsx
"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, BufferGeometry, Float32BufferAttribute } from "three";

import CameraController from "./CameraController";
import IntroOverlay from "./IntroOverlay";
import WaypointIndicator from "./WaypointIndicator";
import Ring from "./Ring";
import {
  worldToScreenPosition,
  isPositionOffScreen,
} from "../utils/math";

// arrow & padding constants
const ARROW_SIZE = 60; // px
const MARGIN = 20;     // px inside the edge
const PAD = ARROW_SIZE / 2 + MARGIN; // inset from each side

type IndicatorState = {
  id: string;
  pos: { x: number; y: number };
  rotation: number;
  off: boolean;
  color: string;
  label?: string;
};

type RingData = {
  id: string;
  position: Vector3;
  radius: number;
};

function createRng(seed: number) {
  let s = seed >>> 0;
  return function rand() {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateRings(seed: number, count: number): RingData[] {
  const rand = createRng(seed);
  const rings: RingData[] = [];
  let z = -20;
  for (let i = 0; i < count; i++) {
    z -= 18 + rand() * 8;
    const x = (rand() - 0.5) * 20 + Math.sin(i * 0.6 + seed) * 3;
    const y = (rand() - 0.5) * 10 + Math.cos(i * 0.4 + seed * 0.5) * 2;
    const pos = new Vector3(x, y, z);
    const radius = 2 + rand() * 1.2;
    rings.push({ id: `ring-${i}`, position: pos, radius });
  }
  return rings;
}

function Scene({
  rings,
  currentIndex,
  setPassed,
  onIndicators,
}: {
  rings: RingData[];
  currentIndex: number;
  setPassed: (idx: number) => void;
  onIndicators: (s: IndicatorState[]) => void;
}) {
  const { camera, gl } = useThree();

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
    const W = gl.domElement.clientWidth;
    const H = gl.domElement.clientHeight;
    const cx = W / 2, cy = H / 2;

    // detect passing current ring
    const current = rings[currentIndex];
    if (current) {
      const dist = camera.position.distanceTo(current.position);
      if (dist < current.radius * 0.9) {
        setPassed(currentIndex);
      }
    }

    // indicator for the next ring only, and only if off-screen
    const next: IndicatorState[] = [];
    if (current) {
      const scr = worldToScreenPosition(
        current.position,
        camera.matrixWorldInverse,
        camera.projectionMatrix,
        W,
        H
      );
      const distWorld = camera.position.distanceTo(current.position);
      const color = "#22d3ee";
      const label = `#${currentIndex + 1} ${Math.round(distWorld)}m`;
      if (isPositionOffScreen(scr, W, H)) {
        const dx = scr.x - cx;
        const dy = scr.y - cy;
        const angle = Math.atan2(dy, dx);
        const scaleX = dx !== 0 ? (cx - PAD) / Math.abs(dx) : Infinity;
        const scaleY = dy !== 0 ? (cy - PAD) / Math.abs(dy) : Infinity;
        const s = Math.min(scaleX, scaleY);
        next.push({
          id: current.id,
          pos: { x: cx + dx * s, y: cy + dy * s },
          rotation: angle,
          off: true,
          color,
          label,
        });
      }
    }

    onIndicators(next);
  });

  return (
    <>
      <points geometry={starsGeo}>
        <pointsMaterial attach="material" size={0.5} color="white" />
      </points>

      {rings.map((r, idx) => (
        <Ring
          key={r.id}
          position={[r.position.x, r.position.y, r.position.z]}
          radius={r.radius}
          thickness={0.12}
          color={idx === currentIndex ? "#22d3ee" : "#334155"}
          opacity={idx === currentIndex ? 0.95 : 0.35}
        />
      ))}

      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
    </>
  );
}

export default function ThreeScene() {
  // Seed and ring sequence params from URL
  const [mounted, setMounted] = useState(false);
  const [seed, setSeed] = useState<number>(0);
  const [ringCount] = useState<number>(() => {
    if (typeof window === "undefined") return 12;
    const p = new URLSearchParams(window.location.search);
    const n = p.get("n");
    return n ? Math.max(3, Math.min(50, parseInt(n, 10))) : 12;
  });
  useEffect(() => {
    // avoid SSR hydration mismatch by seeding after mount
    setSeed(() => {
      const p = new URLSearchParams(window.location.search);
      const s = p.get("seed");
      return s ? parseInt(s, 10) : Math.floor(Math.random() * 1e9);
    });
    setMounted(true);
  }, []);
  const rings = useMemo(() => generateRings(seed, ringCount), [seed, ringCount]);

  // Game progression
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [finishMs, setFinishMs] = useState<number | null>(null);
  // const [splits, setSplits] = useState<number[]>([]);

  // Indicators and smoothing
  const [indicators, setIndicators] = useState<IndicatorState[]>([]);
  const prevIndicatorsRef = useRef<Map<string, IndicatorState>>(new Map());
  const [smoothedIndicators, setSmoothedIndicators] = useState<IndicatorState[]>([]);

  const [showIntro, setShowIntro] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  // Username for persistent records
  const [username, setUsername] = useState<string>("");
  useEffect(() => {
    try {
      const u = localStorage.getItem("username") || "";
      setUsername(u);
    } catch {}
  }, []);
  const saveUsername = (u: string) => {
    setUsername(u);
    try { localStorage.setItem("username", u); } catch {}
  };

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
  }, []);

  // Keep seed and ring count in URL
  useEffect(() => {
    if (!mounted) return;
    const url = new URL(window.location.href);
    url.searchParams.set("seed", String(seed));
    url.searchParams.set("n", String(ringCount));
    window.history.replaceState({}, "", url.toString());
  }, [mounted, seed, ringCount]);

  // Start timer when game begins
  useEffect(() => {
    if (!showIntro && startMs === null) {
      setStartMs(performance.now());
    }
  }, [showIntro, startMs]);

  // Smooth indicators toward targets
  useEffect(() => {
    const prev = prevIndicatorsRef.current;
    const now = new Map<string, IndicatorState>();
    const alpha = 0.25;
    const smoothed = indicators.map((ind) => {
      const p = prev.get(ind.id);
      if (!p) {
        now.set(ind.id, ind);
        return ind;
      }
      const pos = {
        x: p.pos.x + (ind.pos.x - p.pos.x) * alpha,
        y: p.pos.y + (ind.pos.y - p.pos.y) * alpha,
      };
      const rot = p.rotation + (ind.rotation - p.rotation) * alpha;
      const out: IndicatorState = { ...ind, pos, rotation: rot };
      now.set(ind.id, out);
      return out;
    });
    prevIndicatorsRef.current = now;
    setSmoothedIndicators(smoothed);
  }, [indicators]);

  // Handle passing a ring
  const handlePassed = (idx: number) => {
    if (idx !== currentIndex) return;
    const now = performance.now();
    setCurrentIndex((v) => v + 1);
    // setSplits((arr) => [...arr, now]);
    if (idx + 1 >= rings.length) {
      setFinishMs(now);
      if (startMs !== null) {
        const total = now - startMs;
        try {
          const user = username || "Anon";
          // per-seed leaderboard (store objects)
          const keySeed = `leaderboard:${seed}:${ringCount}`;
          const rawSeed = localStorage.getItem(keySeed);
          const listSeed: { user: string; time: number }[] = rawSeed ? JSON.parse(rawSeed) : [];
          listSeed.push({ user, time: total });
          listSeed.sort((a, b) => a.time - b.time);
          localStorage.setItem(keySeed, JSON.stringify(listSeed.slice(0, 10)));

          // global leaderboard across seeds
          const keyGlobal = `leaderboard:global`;
          const rawGlobal = localStorage.getItem(keyGlobal);
          const listGlobal: { user: string; time: number; seed: number; rings: number }[] = rawGlobal ? JSON.parse(rawGlobal) : [];
          listGlobal.push({ user, time: total, seed, rings: rings.length });
          listGlobal.sort((a, b) => a.time - b.time);
          localStorage.setItem(keyGlobal, JSON.stringify(listGlobal.slice(0, 20)));
        } catch {}
      }
    }
  };

  const leaderboard = useMemo<[Array<{user: string; time: number}>, Array<{user: string; time: number; seed: number; rings: number}>]>(() => {
    void finishMs; // ensure dependency is considered used for recomputation after finish
    if (typeof window === "undefined") return [[], []];
    try {
      const keySeed = `leaderboard:${seed}:${ringCount}`;
      const rawSeed = localStorage.getItem(keySeed);
      const perSeed = rawSeed ? JSON.parse(rawSeed) : [];
      const keyGlobal = `leaderboard:global`;
      const rawGlobal = localStorage.getItem(keyGlobal);
      const global = rawGlobal ? JSON.parse(rawGlobal) : [];
      return [perSeed, global];
    } catch {
      return [[], []];
    }
  }, [seed, ringCount, finishMs]);

  const resetRun = () => {
    setCurrentIndex(0);
    setStartMs(performance.now());
    setFinishMs(null);
    // Reset camera/controller to initial transform
    setResetToken((t) => t + 1);
  };

  // Listen for ESC to toggle overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowIntro((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted) {
    // render nothing until client mounted to prevent hydration mismatch
    return null;
  }

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
      >
        {/* Only enable controls when overlay is hidden */}
        {!showIntro && (
          isMobile ? (
            <OrbitControls
              makeDefault
              enablePan={false}
              enableZoom={false}
              rotateSpeed={0.4}
            />
          ) : (
            <CameraController lookSpeed={1.5} moveSpeed={10} resetToken={resetToken} startPosition={[0,1,5]} startRotation={{ x: 0, y: 0 }} />
          )
        )}
        <Scene
          rings={rings}
          currentIndex={currentIndex}
          setPassed={handlePassed}
          onIndicators={setIndicators}
        />
      </Canvas>

      {/* Arrow overlays (multi) */}
      {!showIntro && smoothedIndicators.map((ind) => (
        <WaypointIndicator
          key={ind.id}
          position={ind.pos}
          rotation={ind.rotation}
          color={ind.color}
          label={ind.label}
        />
      ))}

      {/* HUD */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 12,
        padding: "8px 12px",
        background: "rgba(0,0,0,0.45)",
        color: "#fff",
        borderRadius: 8,
        fontSize: 14,
        pointerEvents: "none",
      }}>
        <div><strong>Seed</strong>: {seed} · <strong>Rings</strong>: {currentIndex}/{rings.length}</div>
        <div>
          <strong>Time</strong>: {startMs ? ((finishMs ?? performance.now()) - startMs).toFixed(0) : 0} ms
        </div>
      </div>

      {/* Leaderboards / Controls */}
      <div style={{ position: "absolute", right: 12, top: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          style={{ padding: "8px 12px", background: "#22d3ee", border: "none", borderRadius: 6, cursor: "pointer" }}
          onClick={() => {
            if (typeof window !== "undefined") {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
        >Share URL</button>
        <button
          style={{ padding: "8px 12px", background: "#f59e0b", border: "none", borderRadius: 6, cursor: "pointer" }}
          onClick={resetRun}
        >Reset Run</button>
        <div style={{ background: "rgba(0,0,0,0.45)", color: "#fff", borderRadius: 8, padding: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Top Times (This Seed)</div>
          {(leaderboard[0] as {user: string; time: number}[]).slice(0,5).map((r, i) => (
            <div key={i}>#{i + 1} {r.user}: {(r.time/1000).toFixed(3)}s</div>
          ))}
        </div>
        <div style={{ background: "rgba(0,0,0,0.45)", color: "#fff", borderRadius: 8, padding: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Global Top Times</div>
          {(leaderboard[1] as {user: string; time: number; seed: number; rings: number}[]).slice(0,5).map((r, i) => (
            <div key={i}>#{i + 1} {r.user}: {(r.time/1000).toFixed(3)}s · seed {r.seed} · n {r.rings}</div>
          ))}
        </div>
      </div>

      {/* Intro overlay */}
      {showIntro && (
        <IntroOverlay
          onStart={(name) => {
            saveUsername(name);
            setShowIntro(false);
          }}
          isMobile={isMobile}
          defaultUsername={username}
        />
      )}
    </div>
  );
}
