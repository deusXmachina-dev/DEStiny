"use client";

import { extend } from "@pixi/react";
import { Container, Sprite } from "pixi.js";

import { useAssets } from "../../hooks/useAssets";
import { useVisualization } from "../../hooks/VisualizationContext";
import { Entity } from "./Entity";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite,
});

export const Scene = () => {
  const { isLoaded } = useAssets();
  const { entities, hooks } = useVisualization();

  // Call scene-level hook if provided (e.g., useDndManager in builder mode)
  if (hooks.useScene) {
    hooks.useScene();
  }

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
