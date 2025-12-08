"use client";

import { usePlayback } from "@features/playback";
import { Application } from "@pixi/react";
import { useRef } from "react";

import { DndProvider } from "../hooks/dnd/DndContext";
import { useCanvasDrop } from "../hooks/dnd/useCanvasDrop";
import { useSimulation } from "../hooks/SimulationContext";
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
        <DndProvider>
          <ResizeListener />
          <Background theme={theme}/>
          <Scene />
        </DndProvider>
      </Application>
      {/* Simulation Controls */}
      { /* TODO: This should be moved to the parent component */ }
      <SimulationControls position={hasRecording ? "top" : "center"} />
    </div>
  );
}
