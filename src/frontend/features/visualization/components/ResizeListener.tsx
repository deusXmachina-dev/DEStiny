import { useApplication } from "@pixi/react";
import { useEffect } from "react";

import { $api } from "@/lib/api-client";

import { useVisualization } from "../hooks/VisualizationContext";

export const ResizeListener = () => {
  const { app } = useApplication();
  const { setScreenSize } = useVisualization();

  // keep updating the blueprint screen size
  const { mutate: updateCanvasSize } = $api.useMutation(
    "post",
    "/api/blueprint/canvas-size",
  );

  // Initialize screen size and then listen to resize events
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: app.screen.width, height: app.screen.height });
      updateCanvasSize({
        body: { width: app.screen.width, height: app.screen.height },
      });
    };

    // Initial size
    updateScreenSize();

    // Listen to PixiJS renderer resize events
    const handleResize = () => {
      updateScreenSize();
    };

    app.renderer.on("resize", handleResize);

    // Also observe the container element to catch size changes
    // that might not trigger PixiJS resize events immediately
    // (e.g., when bottom navigation bar appears/disappears)
    const { canvas } = app;
    const container = canvas?.parentElement;

    if (container) {
      const resizeObserver = new ResizeObserver(() => {
        // Get the container's actual dimensions
        const rect = container.getBoundingClientRect();
        const { width } = rect;
        const { height } = rect;

        // Only update if dimensions actually changed and are valid
        if (
          width > 0 &&
          height > 0 &&
          (Math.abs(width - app.screen.width) > 1 ||
            Math.abs(height - app.screen.height) > 1)
        ) {
          // Force PixiJS to resize to match the container
          app.renderer.resize(width, height);
          updateScreenSize();
        }
      });

      resizeObserver.observe(container);

      return () => {
        app.renderer.off("resize", handleResize);
        resizeObserver.disconnect();
      };
    }

    return () => {
      app.renderer.off("resize", handleResize);
    };
  }, [app, setScreenSize]);

  return null;
};
