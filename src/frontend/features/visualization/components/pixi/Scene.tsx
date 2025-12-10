"use client";

import { extend } from "@pixi/react";
import { Container, Sprite } from "pixi.js";

import { useAssets } from "../../hooks/useAssets";
import { useStageInteractions } from "../../hooks/useStageInteractions";
import { useZoomAndPan } from "../../hooks/useZoomAndPan";
import { useVisualization } from "../../hooks/VisualizationContext";
import { Background } from "./Background";
import { Entity } from "./Entity";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite,
});

export const Scene = () => {
  const { isLoaded } = useAssets();
  const { entities, zoom, scrollOffset, theme } = useVisualization();

  // Set up stage-level interaction handlers (drag move, drag end)
  useStageInteractions();

  // Set up zoom and pan handlers
  useZoomAndPan();

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <pixiContainer scale={zoom} x={scrollOffset.x} y={scrollOffset.y}>
      <Background theme={theme} />
      {entities.map((entity) => (
        <Entity key={entity.entityId} {...entity} />
      ))}
    </pixiContainer>
  );
};
