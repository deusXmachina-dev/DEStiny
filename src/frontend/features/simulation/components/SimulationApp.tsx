"use client";

import { usePlayback } from "@features/playback";
import { Application } from "@pixi/react";
import { useRef } from "react";

import { DragProvider } from "../hooks/drag/DragContext";
import { useSimulation } from "../hooks/SimulationContext";
import { useCanvasDrop } from "../hooks/drag/useCanvasDrop";
import { Background } from "./pixi/Background";
import { Scene } from "./pixi/Scene";
import { ResizeListener } from "./ResizeListener";
import { SimulationControls } from "./SimulationControls";

export default function SimulationApp() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { hasRecording } = usePlayback();
  const { theme } = useSimulation();
  const { onDragOver, onDrop } = useCanvasDrop(parentRef);

  return (
    <div
      ref={parentRef}
      className="w-full h-full relative"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Application resizeTo={parentRef}>
        <DragProvider>
          <ResizeListener />
          <Background theme={theme}/>
          <Scene />
        </DragProvider>
      </Application>
      {/* Simulation Controls */}
      { /* TODO: This should be moved to the parent component */ }
      <SimulationControls position={hasRecording ? "top" : "center"} />
    </div>
  );
}
