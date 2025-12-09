"use client";

import { usePlayback } from "@features/playback";
import { Application } from "@pixi/react";
import { useRef } from "react";

import { Background } from "../../visualization/components/pixi/Background";
import { Scene } from "../../visualization/components/pixi/Scene";
import { useVisualization,VisualizationProvider } from "../../visualization/hooks/VisualizationContext";
import { DndProvider } from "../hooks/dnd/DndContext";
import { useCanvasDrop } from "../hooks/dnd/useCanvasDrop";
import { ResizeListener } from "./ResizeListener";
import { SimulationControls } from "./SimulationControls";
import { EntityEditor } from "./ui/EntityEditor";

function SimulationAppContent() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { hasRecording } = usePlayback();
  const { theme } = useVisualization();
  const { onDragOver, onDrop } = useCanvasDrop(parentRef);

  return (
    <div
      ref={parentRef}
      className="w-full h-full relative"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Application resizeTo={parentRef}>
        <ResizeListener />
        <Background theme={theme}/>
        <Scene />
      </Application>
      {/* Simulation Controls */}
      { /* TODO: This should be moved to the parent component */ }
      <SimulationControls position={hasRecording ? "top" : "center"} />
      {/* Entity Editor */}
      <EntityEditor />
    </div>
  );
}

export default function SimulationApp() {
  return (
    <VisualizationProvider>
      <DndProvider>
        <SimulationAppContent />
      </DndProvider>
    </VisualizationProvider>
  );
}
