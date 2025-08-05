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
  const keys = useRef({ w: false, a: false, s: false, d: false });

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
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k as keyof typeof keys.current] = false;
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

    // Look only when pointer is off-center
    if (Math.abs(dx) > 0.01) {
      camera.rotation.y -= dx * lookSpeed * delta;
    }
    if (Math.abs(dy) > 0.01) {
      camera.rotation.x -= dy * lookSpeed * delta;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }

    // Movement
    const dir = new Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new Vector3().crossVectors(dir, camera.up).normalize();

    const velocity = new Vector3();
    if (keys.current.w) velocity.add(dir);
    if (keys.current.s) velocity.sub(dir);
    if (keys.current.a) velocity.sub(right);
    if (keys.current.d) velocity.add(right);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().multiplyScalar(moveSpeed * delta);
      camera.position.add(velocity);
    }
  });

  return null;
}
