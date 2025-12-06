"use client";

import { extend, useApplication } from "@pixi/react";
import { Container, Sprite } from "pixi.js";
import { useEffect } from "react";

import { useSimulation } from "../../hooks/SimulationContext";
import { useAssets } from "../../hooks/useAssets";
import { useEntityRenderer } from "../../hooks/useEntityRenderer";
import { calculateSceneOffset } from "../../utils";
import { Entity } from "./Entity";

// Extend Pixi.js components for @pixi/react
extend({
  Container,
  Sprite,
});

export const Scene = () => {
  const { isLoaded } = useAssets();
  const { boundingBox, screenSize } = useSimulation();

  const entities = useEntityRenderer();

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  // Calculate centering offset based on bounding box
  const { offsetX, offsetY } = calculateSceneOffset(
    boundingBox,
    screenSize.width,
    screenSize.height
  );

  return (
    <pixiContainer x={offsetX} y={offsetY}>
      {entities.map((entity) => (
        <Entity
          key={entity.entityId}
          {...entity}
        />
      ))}
    </pixiContainer>
  );
};

