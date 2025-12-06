"use client";

import { usePlayback } from "@features/playback";
import { Application } from "@pixi/react";
import { useRef } from "react";

import { useSimulation } from "../hooks/SimulationContext";
import { calculateSceneOffset, createBlueprintEntity, screenToWorldCoordinates } from "../utils";
import { Background } from "./pixi/Background";
import { Scene } from "./pixi/Scene";
import { SimulationControls } from "./SimulationControls";
import { ResizeListener } from "./ResizeListener";

export default function SimulationApp() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { hasRecording } = usePlayback();
  const { theme, mode, blueprint, setBlueprint, boundingBox, screenSize } = useSimulation();
    
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (mode !== "builder") {
      return;
    }

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const { entityType, parameters } = data;

      // Get drop coordinates relative to the container
      const rect = parentRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Calculate offset for coordinate conversion
      const { offsetX, offsetY } = calculateSceneOffset(
        boundingBox,
        screenSize.width,
        screenSize.height
      );

      // Convert to world coordinates
      const { x, y } = screenToWorldCoordinates(screenX, screenY, offsetX, offsetY);

      // Create new entity
      const newEntity = createBlueprintEntity(entityType, parameters, x, y);

      // Add to blueprint
      const currentBlueprint = blueprint || {
        simParams: {
          initialTime: 0,
        },
        entities: [],
      };

      setBlueprint({
        ...currentBlueprint,
        entities: [...currentBlueprint.entities, newEntity],
      });
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  return (
    <div
      ref={parentRef}
      className="w-full h-full relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
