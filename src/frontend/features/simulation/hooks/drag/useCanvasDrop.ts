"use client";

import { RefObject } from "react";

import { createBlueprintEntity } from "../../utils";
import { useSimulation } from "../SimulationContext";

/**
 * Hook to handle dropping new entities onto the canvas.
 * 
 * Provides handlers for HTML5 drag and drop API to add new entities
 * to the simulation blueprint when dropped from external sources
 * (e.g., entity palette, sidebar).
 * 
 * Only active in "builder" mode.
 * 
 * @param containerRef - Ref to the container element that receives drops
 * @returns Object with onDragOver and onDrop handlers
 */
export const useCanvasDrop = (containerRef: RefObject<HTMLDivElement | null>) => {
  const { mode, blueprint, setBlueprint } = useSimulation();

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
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

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

  return {
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };
};
