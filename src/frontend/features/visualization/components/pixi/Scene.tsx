"use client";

import { extend } from "@pixi/react";
import { Container as PixiContainer, Sprite } from "pixi.js";
import { RefObject, useEffect, useRef } from "react";

import { useAssets } from "../../hooks/useAssets";
import { useCanvasResize } from "../../hooks/useCanvasResize";
import { useSceneInteractions } from "../../hooks/useSceneInteractions";
import { useVisualization } from "../../hooks/VisualizationContext";
import { SceneManager } from "../../pixi/SceneManager";

// Extend Pixi.js components for @pixi/react
extend({
  Container: PixiContainer,
  Sprite,
});

interface SceneProps {
  parentRef: RefObject<HTMLDivElement | null>;
}

export const Scene = ({ parentRef }: SceneProps) => {
  const { isLoaded, getTexture } = useAssets();
  const {
    theme: initialTheme,
    interactive,
    getInteractionCallbacks,
    registerSceneManager,
  } = useVisualization();

  // Refs for container and manager
  const containerRef = useRef<PixiContainer | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  useSceneInteractions();
  useCanvasResize(parentRef);

  // Initialize SceneManager once when container is ready
  // SceneManager will initialize BackgroundManager and EntityManager internally
  useEffect(() => {
    if (!isLoaded || !containerRef.current) {
      return;
    }

    // Create and initialize SceneManager
    const sceneManager = new SceneManager();
    sceneManager.initialize({
      container: containerRef.current,
      theme: initialTheme,
      getTexture,
      getInteractionCallbacks,
      interactive,
    });
    sceneManagerRef.current = sceneManager;
    registerSceneManager(sceneManager);

    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
    };
    // SceneManager is initialized once. Updates (screenSize, theme) go directly to managers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!isLoaded) {
    return null;
  }

  return <pixiContainer ref={containerRef} />;
};
