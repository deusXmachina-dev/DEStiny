"use client";

import { extend } from "@pixi/react";
import { Container, Sprite as PixiSprite } from "pixi.js";
import { useRef } from "react";

import { useAssets } from "../../hooks/useAssets";
import { useVisualization } from "../../hooks/VisualizationContext";
import { SimulationEntityState } from "../../types";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite: PixiSprite,
});

export const Entity = ({
  entityType,
  x,
  y,
  angle,
  children,
  entityId,
}: SimulationEntityState) => {
  const { getTexture } = useAssets();
  const { hooks } = useVisualization();
  const texture = getTexture(entityType);
  const containerRef = useRef<Container | null>(null);

  // Call entity-level hook if provided (e.g., useDraggable + useEntityClick in builder mode)
  if (hooks.useEntity) {
    hooks.useEntity(containerRef, entityId);
  }

  return (
    <pixiContainer ref={containerRef} x={x} y={y} rotation={angle}>
      <pixiSprite texture={texture} anchor={0.5} x={0} y={0} rotation={0} />
      {children?.map((child) => (
        <Entity key={child.entityId} {...child} />
      ))}
    </pixiContainer>
  );
};
