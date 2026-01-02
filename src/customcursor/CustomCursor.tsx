"use client";
import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorType, setCursorType] = useState("default");

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest("button, a, input[type='checkbox']")) {
        setCursorType("pointer");
      } else if (target.closest("input, textarea, select")) {
        setCursorType("text");
      } else if (target.classList.contains("wait")) {
        setCursorType("wait");
      } else if (target.classList.contains("crosshair")) {
        setCursorType("crosshair");
      } else if (target.classList.contains("help")) {
        setCursorType("help");
      } else if (target.classList.contains("not-allowed")) {
        setCursorType("not-allowed");
      } else if (target.classList.contains("grab")) {
        setCursorType("grab");
      } else if (target.classList.contains("grabbing")) {
        setCursorType("grabbing");
      } else if (target.classList.contains("move")) {
        setCursorType("move");
      } else {
        setCursorType("default");
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <div
      className="custom-cursor"
      style={{
        width: "24px",
        height: "24px",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(0, 0)", // Ensure top-left is the pointer
        backgroundImage: `url('/cursors/${cursorType}.svg')`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        pointerEvents: "none",
        position: "fixed",
        zIndex: 9999,
      }}
    />
  );
}
