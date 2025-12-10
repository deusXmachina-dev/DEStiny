"use client";

import { useApplication } from "@pixi/react";
import { useEffect } from "react";

/**
 * Component to attach wheel event handler directly to the canvas element
 * to prevent page scrolling when zooming.
 */
export const CanvasWheelHandler = () => {
  const { app } = useApplication();

  useEffect(() => {
    const canvas = app.canvas;
    if (!canvas) {
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Use capture phase to catch event before it bubbles
    canvas.addEventListener("wheel", handleWheel, { passive: false, capture: true });

    return () => {
      canvas.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [app]);

  return null;
};
