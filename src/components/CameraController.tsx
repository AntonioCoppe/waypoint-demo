"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

interface CameraControllerProps {
  lookSpeed?: number;
  moveSpeed?: number;
  resetToken?: number;
  startPosition?: [number, number, number];
  startRotation?: { x?: number; y?: number };
}

export default function CameraController({
  lookSpeed = 1.5,
  moveSpeed = 10,
  resetToken,
  startPosition = [0, 1, 5],
  startRotation,
}: CameraControllerProps) {
  const { camera, size, gl } = useThree();
  const pointer = useRef({ x: size.width / 2, y: size.height / 2 });
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false, space: false, ctrl: false, q: false, e: false });
  const velocityRef = useRef(new Vector3(0, 0, 0));
  const targetRotRef = useRef({ x: camera.rotation.x, y: camera.rotation.y });
  const lastLogRef = useRef(0);
  const debug = true;

  // Track mouse
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    };
    const onLeave = () => {
      pointer.current.x = size.width / 2;
      pointer.current.y = size.height / 2;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [size.width, size.height]);

  // Reset handler
  useEffect(() => {
    if (resetToken === undefined) return;
    // reset camera transform
    camera.position.set(startPosition[0], startPosition[1], startPosition[2]);
    const rx = startRotation?.x ?? 0;
    const ry = startRotation?.y ?? 0;
    camera.rotation.set(rx, ry, 0);
    targetRotRef.current.x = rx;
    targetRotRef.current.y = ry;
    // zero velocity
    velocityRef.current.set(0, 0, 0);
    // recenter pointer target
    pointer.current.x = size.width / 2;
    pointer.current.y = size.height / 2;
  }, [resetToken, camera, size.width, size.height, startPosition, startRotation?.x, startRotation?.y]);

  // Track keys
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const code = e.code;
      switch (code) {
        case "KeyW": keys.current.w = true; break;
        case "KeyA": keys.current.a = true; break;
        case "KeyS": keys.current.s = true; break;
        case "KeyD": keys.current.d = true; break;
        case "ShiftLeft": case "ShiftRight": keys.current.shift = true; break;
        case "Space": keys.current.space = true; break;
        case "ControlLeft": case "ControlRight": keys.current.ctrl = true; break;
        default: {
          const k = e.key.toLowerCase();
          if (k === "w") keys.current.w = true;
          else if (k === "a") keys.current.a = true;
          else if (k === "s") keys.current.s = true;
          else if (k === "d") keys.current.d = true;
          else if (k === "shift") keys.current.shift = true;
        }
      }
      if (code === "Space" || code.startsWith("Arrow")) e.preventDefault();
      if (debug) console.log("[keys] down", e.code, e.key, { ...keys.current });
    };
    const up = (e: KeyboardEvent) => {
      const code = e.code;
      switch (code) {
        case "KeyW": keys.current.w = false; break;
        case "KeyA": keys.current.a = false; break;
        case "KeyS": keys.current.s = false; break;
        case "KeyD": keys.current.d = false; break;
        case "ShiftLeft": case "ShiftRight": keys.current.shift = false; break;
        case "Space": keys.current.space = false; break;
        case "ControlLeft": case "ControlRight": keys.current.ctrl = false; break;
        default: {
          const k = e.key.toLowerCase();
          if (k === "w") keys.current.w = false;
          else if (k === "a") keys.current.a = false;
          else if (k === "s") keys.current.s = false;
          else if (k === "d") keys.current.d = false;
          else if (k === "shift") keys.current.shift = false;
        }
      }
      if (debug) console.log("[keys] up", e.code, e.key, { ...keys.current });
    };
    const targetEl: HTMLElement | Window = (gl?.domElement as HTMLElement) ?? window;
    targetEl.addEventListener("keydown", down as EventListener, { passive: false } as AddEventListenerOptions);
    targetEl.addEventListener("keyup", up as EventListener, { passive: true } as AddEventListenerOptions);
    return () => {
      targetEl.removeEventListener("keydown", down as EventListener);
      targetEl.removeEventListener("keyup", up as EventListener);
    };
  }, [debug, gl]);

  useFrame((_, delta) => {
    const cx = size.width / 2;
    const cy = size.height / 2;
    const dx = (pointer.current.x - cx) / cx;
    const dy = (pointer.current.y - cy) / cy;

    // Smooth look (lerp to target rotation)
    const targetY = targetRotRef.current.y - dx * lookSpeed * delta;
    const targetX = targetRotRef.current.x - dy * lookSpeed * delta;
    targetRotRef.current.y = targetY;
    targetRotRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetX));
    const lookLerp = 0.35; // more responsive
    camera.rotation.y += (targetRotRef.current.y - camera.rotation.y) * lookLerp;
    camera.rotation.x += (targetRotRef.current.x - camera.rotation.x) * lookLerp;

    // Direct, robust translation in camera-local space
    const boost = keys.current.shift ? 2.0 : 1.0;
    const step = moveSpeed * boost * delta;
    if (keys.current.w) { camera.translateZ(-step); }
    if (keys.current.s) { camera.translateZ(step); }
    if (keys.current.a) { camera.translateX(-step); }
    if (keys.current.d) { camera.translateX(step); }
    if (keys.current.space) { camera.position.y += step; }
    if (keys.current.ctrl) { camera.position.y -= step; }

    // periodic debug log
    if (debug) {
      const t = performance.now();
      if (t - lastLogRef.current > 500) {
        lastLogRef.current = t;
        console.log("[move] pos=", camera.position.toArray().map((n: number) => n.toFixed(2)).join(","), "keys=", { ...keys.current });
      }
    }
  });

  return null;
}
