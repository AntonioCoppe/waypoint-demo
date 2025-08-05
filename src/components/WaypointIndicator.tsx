// src/components/WaypointIndicator.tsx
export default function WaypointIndicator({ position, rotation }) {
    return <div style={{
      position: 'absolute',
      left: position.x,
      top: position.y,
      transform: `rotate(${rotation}rad)`
    }}>🡪</div>;
  }
  