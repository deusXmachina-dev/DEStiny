"use client";

import { extend } from "@pixi/react";
import { Container, Sprite } from "pixi.js";

import { useAssets } from "../../hooks/useAssets";
import { useStageInteractions } from "../../hooks/useStageInteractions";
import { useVisualization } from "../../hooks/VisualizationContext";
import { Entity } from "./Entity";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite,
});

export const Scene = () => {
  const { isLoaded } = useAssets();
  const { entities } = useVisualization();

  // Set up stage-level interaction handlers (drag move, drag end)
  useStageInteractions();

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <pixiContainer>
      {entities.map((entity) => (
        <Entity key={entity.entityId} {...entity} />
      ))}
    </pixiContainer>
  );
};
