"use client";

import { extend } from "@pixi/react";
import { Container, Sprite as PixiSprite } from "pixi.js";
import { useRef } from "react";

import { useDraggable } from "../../hooks/dnd/useDraggable";
import { useAssets } from "../../hooks/useAssets";
import { useEntityClick } from "../../hooks/useEntityClick";
import { SimulationEntityState } from "../../types";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite: PixiSprite,
});

export const Entity = ({ entityType, x, y, angle, children, entityId }: SimulationEntityState) => {
  const { getTexture } = useAssets();
  const texture = getTexture(entityType);
  const containerRef = useRef<Container | null>(null);

  // Set up drag start handler for this entity (only active in builder mode)
  useDraggable(containerRef, entityId);

  // Set up click handler for this entity (only active in builder mode)
  useEntityClick(containerRef, entityId);

  return (
    <pixiContainer
      ref={containerRef}
      x={x}
      y={y}
      rotation={angle}
    >
      <pixiSprite
        texture={texture}
        anchor={0.5}
        x={0}
        y={0}
        rotation={0}
      />
      {children?.map((child) => (
        <Entity
          key={child.entityId}
          {...child}
        />
      ))}
    </pixiContainer>
  );
};

