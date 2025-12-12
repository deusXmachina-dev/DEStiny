"use client";

import { BuilderContext } from "@features/builder/hooks/BuilderContext";
import { extend } from "@pixi/react";
import { Container, Sprite as PixiSprite, Text as PixiText } from "pixi.js";
import { useContext, useRef } from "react";

import { useAssets } from "../../hooks/useAssets";
import { useEntityInteractions } from "../../hooks/useEntityInteractions";
import { SimulationEntityState } from "../../types";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite: PixiSprite,
  Text: PixiText,
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
  const builderContext = useContext(BuilderContext);

  // Set up entity-level interactions (drag start, click)
  useEntityInteractions(containerRef, entityId);

  // Only render PixiJS text if not in builder mode (builder mode uses HTML overlay)
  const isBuilderMode = builderContext !== undefined;

  return (
    <pixiContainer ref={containerRef} x={x} y={y} rotation={angle}>
      <pixiSprite texture={texture} anchor={0.5} x={0} y={0} rotation={0} />
      {name && !isBuilderMode && (
        <pixiText
          text={name}
          anchor={0.5}
          x={0}
          y={35}
          style={{
            fontSize: 12,
            fill: 0xffffff,
            stroke: 0x000000,
            strokeThickness: 2,
            align: "center",
          }}
        />
      )}
      {children?.map((child) => (
        <Entity key={child.entityId} {...child} />
      ))}
    </pixiContainer>
  );
};
