"use client";

import { extend } from "@pixi/react";
import { Container, Sprite as PixiSprite } from "pixi.js";
import { useRef } from "react";

import { useAssets } from "../../hooks/useAssets";
import { useEntityInteractions } from "../../hooks/useEntityInteractions";
import { SimulationEntityState } from "../../types";
import { EntityName } from "./EntityName";

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
  name,
}: SimulationEntityState) => {
  const { getTexture } = useAssets();
  const texture = getTexture(entityType);
  const containerRef = useRef<Container | null>(null);

  // Set up entity-level interactions (drag start, click)
  useEntityInteractions(containerRef, entityId);

  return (
    <pixiContainer ref={containerRef} x={x} y={y} rotation={angle}>
      <pixiSprite texture={texture} anchor={0.5} x={0} y={0} rotation={0} />
      <EntityName name={name || ""} />
      {children?.map((child) => (
        <Entity key={child.entityId} {...child} />
      ))}
    </pixiContainer>
  );
};
