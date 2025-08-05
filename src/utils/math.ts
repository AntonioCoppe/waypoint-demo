import { Vector3, Quaternion, Matrix4, Vector4 } from 'three';

export interface ScreenPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Projects a world-space point into screen coordinates.
 */
export function worldToScreenPosition(
  worldPos: Vector3,
  viewMatrix: Matrix4,
  projMatrix: Matrix4,
  width: number,
  height: number
): ScreenPosition {
  // combine view + projection
  const viewProj = new Matrix4().multiplyMatrices(projMatrix, viewMatrix);

  // clip-space homogeneous vector
  const clip = new Vector4(worldPos.x, worldPos.y, worldPos.z, 1.0).applyMatrix4(viewProj);

  // NDC
  const ndc = clip.clone().divideScalar(clip.w);

  return {
    x: (ndc.x + 1) * 0.5 * width,
    y: (1 - ndc.y) * 0.5 * height,
    z: ndc.z,
  };
}

export function isPositionOffScreen(
  s: ScreenPosition,
  width: number,
  height: number
): boolean {
  return (
    s.z > 1 || s.z < -1 ||
    s.x < 0 || s.x > width ||
    s.y < 0 || s.y > height
  );
}

/**
 * Finds the last on-screen point along the great-circle arc from the camera's forward
 * direction toward the waypoint. Returns both the clamped screen pos and the arrow angle.
 */
export function findLastOnScreenPosition(
  cameraPos: Vector3,
  waypointPos: Vector3,
  cameraForward: Vector3,
  width: number,
  height: number,
  viewMatrix: Matrix4,
  projMatrix: Matrix4
): { pos: ScreenPosition; rotation: number } {
  const dist = waypointPos.distanceTo(cameraPos);
  const startDir = cameraForward.clone().normalize();
  const endDir = waypointPos.clone().sub(cameraPos).normalize();

  // Compute axis & total angle between forward and target
  const dot = Math.max(-1, Math.min(1, startDir.dot(endDir)));
  const maxAngle = Math.acos(dot);
  const axis = startDir.clone().cross(endDir).normalize();

  let low = 0;
  let high = maxAngle;
  let bestAngle = 0;
  const tol = 0.001;

  while (high - low > tol) {
    const mid = (low + high) / 2;
    const q = new Quaternion().setFromAxisAngle(axis, mid);
    const dir = startDir.clone().applyQuaternion(q).normalize();
    const testPoint = cameraPos.clone().add(dir.multiplyScalar(dist));
    const scr = worldToScreenPosition(testPoint, viewMatrix, projMatrix, width, height);

    if (isPositionOffScreen(scr, width, height)) {
      high = mid;
    } else {
      low = mid;
      bestAngle = mid;
    }
  }

  // Final position + rotation
  const finalQ = new Quaternion().setFromAxisAngle(axis, bestAngle);
  const finalDir = startDir.clone().applyQuaternion(finalQ).normalize();
  const finalPoint = cameraPos.clone().add(finalDir.multiplyScalar(dist));
  const finalScreen = worldToScreenPosition(finalPoint, viewMatrix, projMatrix, width, height);

  // Compute 2D arrow angle
  const cx = width / 2, cy = height / 2;
  const dx = finalScreen.x - cx, dy = finalScreen.y - cy;
  const angle = Math.atan2(-dy, dx);

  return { pos: finalScreen, rotation: angle };
}
