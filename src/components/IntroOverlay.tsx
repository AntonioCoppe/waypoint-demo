"use client";

import React from "react";

interface IntroOverlayProps {
  onStart: (username: string) => void;
  isMobile: boolean;
  defaultUsername?: string;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  padding: "16px",
  zIndex: 1000,
};

const titleStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "bold",
  marginBottom: "16px",
};

const listStyle: React.CSSProperties = {
  listStyleType: "none",
  padding: 0,
  marginBottom: "24px",
  fontSize: "18px",
  textAlign: "center",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  backgroundColor: "#fff",
  color: "#000",
  fontSize: "16px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

export default function IntroOverlay({ onStart, isMobile, defaultUsername = "" }: IntroOverlayProps) {
  const [name, setName] = React.useState<string>(defaultUsername);
  return (
    <div style={overlayStyle}>
      <h1 style={titleStyle}>Controls</h1>
      <ul style={listStyle}>
        {isMobile ? (
          <>
            <li>
              <strong>Touch & Drag</strong> – Look around
            </li>
          </>
        ) : (
          <>
            <li>
              <strong>W / A / S / D</strong> – Move fwd / left / back / right
            </li>
            <li>
              <strong>Mouse Drag</strong> – Look around
            </li>
            <li>
              <strong>Click Canvas</strong> – Focus controls
            </li>
          </>
        )}
      </ul>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={{ padding: '10px 12px', borderRadius: 8, border: 'none', minWidth: 200 }}
        />
      </div>
      <button style={{...buttonStyle, opacity: name.trim() ? 1 : 0.5, cursor: name.trim() ? 'pointer' : 'not-allowed'}} disabled={!name.trim()} onClick={() => onStart(name.trim())}>
        Start
      </button>
    </div>
  );
}
