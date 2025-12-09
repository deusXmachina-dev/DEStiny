"use client";

import { extend } from "@pixi/react";
import { Container, Sprite } from "pixi.js";

import { useDndManager } from "../../../builder/hooks/dnd/useDndManager";
import { useEntityRenderer } from "../../../simulation/hooks/useEntityRenderer";
import { useAssets } from "../../hooks/useAssets";
import { Entity } from "./Entity";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite,
});

export const Scene = () => {
  const { isLoaded } = useAssets();
  const entities = useEntityRenderer();
  
  // Set up stage-level drag handlers (only active in builder mode)
  useDndManager();

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <pixiContainer>
      {entities.map((entity) => (
        <Entity
          key={entity.entityId}
          {...entity}
        />
      ))}
    </pixiContainer>
  );
};

