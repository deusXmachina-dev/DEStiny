"use client";

import { usePlayback } from "@features/playback";
import { Application } from "@pixi/react";
import { useRef } from "react";

import { useSimulation } from "../hooks/SimulationContext";
import { Background } from "./pixi/Background";
import { Scene } from "./pixi/Scene";
import { SimulationControls } from "./SimulationControls";
import { ResizeListener } from "./ResizeListener";

export default function SimulationApp() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { hasRecording } = usePlayback();
  const { theme } = useSimulation();
    
  // Dynamic positioning: center & large when no recording, top-right & small when recording exists

  return (
    <div ref={parentRef} className="w-full h-full relative">
      <Application resizeTo={parentRef}>
        <ResizeListener />
        <Background theme={theme}/>
        <Scene />
      </Application>
      {/* Simulation Controls */}
      { /* TODO: This should be moved to the parent component */ }
      <SimulationControls position={hasRecording ? "top" : "center"} />
    </div>
  );
}
