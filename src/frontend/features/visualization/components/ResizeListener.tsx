import { useApplication } from "@pixi/react";
import { useEffect } from "react";

import { useVisualization } from "../hooks/VisualizationContext";

export const ResizeListener = () => {
  const { app } = useApplication();
  const { setScreenSize } = useVisualization();

  // Initialize screen size and then listen to resize events
  useEffect(() => {
    setScreenSize({ width: app.screen.width, height: app.screen.height });

    const handleResize = () => {
      setScreenSize({ width: app.screen.width, height: app.screen.height });
    };

    app.renderer.on("resize", handleResize);

    return () => {
      app.renderer.off("resize", handleResize);
    };
  }, [app, setScreenSize]);

  return null;
};
