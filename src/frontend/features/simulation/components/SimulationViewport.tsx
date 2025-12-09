"use client";

import { usePlayback } from "@features/playback";
import { SceneVisualization } from "@features/visualization/components/SceneVisualization";
import { VisualizationProvider } from "@features/visualization/hooks/VisualizationContext";
import { useVisualization } from "@features/visualization/hooks/VisualizationContext";
import { useRef } from "react";
import { useEffect } from "react";

import { useSimulationEntities } from "../hooks/useSimulationEntities";
import { SimulationControls } from "./SimulationControls";

/**
 * SimulationEntityUpdater - Component that runs inside Pixi Application context.
 *
 * This component calls useSimulationEntities (which requires useTick) and
 * updates the VisualizationContext with the current entities.
 *
 * Must be used inside a Pixi Application context.
 */
function SimulationEntityUpdater() {
  const entities = useSimulationEntities({ enabled: true });
  const { setEntities } = useVisualization();

  useEffect(() => {
    setEntities(entities);
  }, [entities, setEntities]);

  return null;
}

/**
 * SimulationViewport - Main viewport component for simulation mode.
 *
 * This component:
 * - Provides empty entities initially to VisualizationContext
 * - Renders SceneVisualization with SimulationEntityUpdater as child
 * - SimulationEntityUpdater updates entities from simulation engine
 * - Renders SimulationControls overlay
 *
 * Must be used within PlaybackProvider.
 */
export const SimulationViewport = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { hasRecording } = usePlayback();

  return (
    <VisualizationProvider hooks={{}}>
      <SceneVisualization parentRef={parentRef}>
        <SimulationEntityUpdater />
      </SceneVisualization>
      <SimulationControls position={hasRecording ? "top" : "center"} />
    </VisualizationProvider>
  );
};
