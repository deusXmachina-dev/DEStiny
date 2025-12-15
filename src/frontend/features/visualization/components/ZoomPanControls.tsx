"use client";

import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useVisualization } from "../hooks/VisualizationContext";
import { useSceneTransform } from "../hooks/useSceneTransform";
import { useCallback } from "react";

/**
 * ZoomPanControls - Minimal inline display of zoom and pan state with reset button.
 *
 * Shows:
 * - Current zoom level (as percentage)
 * - Current scroll offset (x, y)
 * - Single reset button that resets both zoom and position
 *
 * Uses throttled subscription to SceneManager to avoid excessive re-renders.
 * Must be used within a VisualizationProvider.
 */
export const ZoomPanControls = () => {
  const { zoom, scrollOffset } = useSceneTransform(100); // 100ms throttle
  const { getSceneManager, sceneManagerReady } = useVisualization();

  const handleReset = useCallback(() => {
    const sceneManager = getSceneManager();
    if (sceneManager && sceneManagerReady) {
      sceneManager.reset();
    }
  }, [sceneManagerReady]);

  return (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-2 rounded-md border bg-background/30 px-2 py-1.5 text-xs shadow-sm backdrop-blur-sm transition-all hover:bg-background/50">
      <span className="text-muted-foreground">
        Zoom: <span className="font-mono">{(zoom * 100).toFixed(0)}%</span>
      </span>
      <span className="text-muted-foreground">|</span>
      <span className="text-muted-foreground">
        Pos:{" "}
        <span className="font-mono">
          ({scrollOffset.x.toFixed(0)}, {scrollOffset.y.toFixed(0)})
        </span>
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleReset}
        className="h-5 w-5"
        title="Reset zoom and position"
      >
        <RotateCw className="h-3 w-3" />
      </Button>
    </div>
  );
};
