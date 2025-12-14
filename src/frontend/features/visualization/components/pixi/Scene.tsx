"use client";

import { extend } from "@pixi/react";
import { Container as PixiContainer, Sprite } from "pixi.js";
import { useEffect, useMemo, useRef } from "react";

import { useAssets } from "../../hooks/useAssets";
import { useStageInteractions } from "../../hooks/useStageInteractions";
import { useZoomAndPan } from "../../hooks/useZoomAndPan";
import { useVisualization } from "../../hooks/VisualizationContext";
import { EntityManager } from "../../pixi/EntityManager";
import { Background } from "./Background";

// Extend Pixi.js components for @pixi/react
extend({
  Container: PixiContainer,
  Sprite,
});

export const Scene = () => {
  const { isLoaded, getTexture } = useAssets();
  const {
    zoom,
    scrollOffset,
    theme,
    interactive,
    getInteractionCallbacks,
    registerEntityManager,
  } = useVisualization();

  console.debug("Scene rerender");

  // Ref to the container that EntityManager will use
  const entityContainerRef = useRef<PixiContainer | null>(null);
  const entityManagerRef = useRef<EntityManager | null>(null);

  // Set up stage-level interaction handlers (drag move, drag end)
  useStageInteractions();

  // Set up zoom and pan handlers
  useZoomAndPan();

  // Memoize Background to only update when theme changes
  const memoizedBackground = useMemo(
    () => <Background theme={theme} />,
    [theme],
  );

  // Initialize EntityManager when assets are loaded and container is ready
  useEffect(() => {
    if (!isLoaded || !entityContainerRef.current) {
      return;
    }

    // Create EntityManager if not already created
    if (!entityManagerRef.current) {
      entityManagerRef.current = new EntityManager(
        entityContainerRef.current,
        getTexture,
        getInteractionCallbacks,
        interactive,
      );
      registerEntityManager(entityManagerRef.current);
    }

    return () => {
      if (entityManagerRef.current) {
        entityManagerRef.current.dispose();
        entityManagerRef.current = null;
      }
    };
  }, [isLoaded, getTexture, getInteractionCallbacks, interactive, registerEntityManager]);

  if (!isLoaded) {
    return null;
  }

  return (
    <pixiContainer scale={zoom} x={scrollOffset.x} y={scrollOffset.y}>
      {memoizedBackground}
      <pixiContainer ref={entityContainerRef} />
    </pixiContainer>
  );
};
