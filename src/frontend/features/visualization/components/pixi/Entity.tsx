"use client";

import { extend } from "@pixi/react";
import { Container, Sprite as PixiSprite } from "pixi.js";
import { useEffect, useRef } from "react";

import { useAssets } from "../../hooks/useAssets";
import { useEntityInteractions } from "../../hooks/useEntityInteractions";
import { useVisualization } from "../../hooks/VisualizationContext";
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
  const { registerEntityRef, unregisterEntityRef } = useVisualization();
  const texture = getTexture(entityType);
  const containerRef = useRef<Container | null>(null);

  // Set up entity-level interactions (drag start, click)
  useEntityInteractions(containerRef, entityId);

  // Register container ref for direct position updates (bypasses React re-renders)
  useEffect(() => {
    if (containerRef.current) {
      registerEntityRef(entityId, containerRef.current);
    }
    return () => unregisterEntityRef(entityId);
  }, [entityId, registerEntityRef, unregisterEntityRef]);

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
