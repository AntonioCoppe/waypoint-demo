"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

interface CameraControllerProps {
  lookSpeed?: number;
  moveSpeed?: number;
}

export default function CameraController({
  lookSpeed = 1.5,
  moveSpeed = 10,
}: CameraControllerProps) {
  const { camera, size } = useThree();
  const pointer = useRef({ x: size.width / 2, y: size.height / 2 });
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false, space: false, ctrl: false, q: false, e: false });
  const velocityRef = useRef(new Vector3(0, 0, 0));
  const targetRotRef = useRef({ x: camera.rotation.x, y: camera.rotation.y });

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

  // Track keys
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k as keyof typeof keys.current] = true;
      if (e.code === "Space") keys.current.space = true;
      if (e.ctrlKey || e.key === "Control" || e.code === "ControlLeft" || e.code === "ControlRight") keys.current.ctrl = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k as keyof typeof keys.current] = false;
      if (e.code === "Space") keys.current.space = false;
      if (!e.ctrlKey && (e.key === "Control" || e.code === "ControlLeft" || e.code === "ControlRight")) keys.current.ctrl = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

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
    camera.rotation.y += (targetRotRef.current.y - camera.rotation.y) * 0.2;
    camera.rotation.x += (targetRotRef.current.x - camera.rotation.x) * 0.2;

    // Movement with acceleration/drag and boost
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    // allow vertical flight (keep full forward including y)
    forward.normalize();
    const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    const input = new Vector3();
    if (keys.current.w) input.add(forward);
    if (keys.current.s) input.sub(forward);
    if (keys.current.a) input.sub(right);
    if (keys.current.d) input.add(right);

    // vertical controls
    if (keys.current.space) input.y += 1;
    if (keys.current.ctrl) input.y -= 1;
    if (input.lengthSq() > 0) input.normalize();
    const boost = keys.current.shift ? 2.0 : 1.0;
    const accel = moveSpeed * 2.5 * boost;
    const drag = 4.0; // per second

    // integrate velocity
    const v = velocityRef.current;
    v.addScaledVector(input, accel * delta);
    // apply drag
    const dragFactor = Math.max(0, 1 - drag * delta);
    v.multiplyScalar(dragFactor);

    // clamp very small velocities
    if (v.lengthSq() < 1e-6) v.set(0, 0, 0);

    camera.position.addScaledVector(v, delta);
  });

  return null;
}
