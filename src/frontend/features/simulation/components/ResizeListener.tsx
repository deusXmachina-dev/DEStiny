import { useApplication } from "@pixi/react";
import { useEffect } from "react";

import { useSimulation } from "../hooks/SimulationContext";


export const ResizeListener = () => {
  const { app } = useApplication();
  const { setScreenSize } = useSimulation();

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
  }, [app]);

  return null;
};