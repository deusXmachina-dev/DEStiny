"use client";

import { useBuilder } from "@features/builder";
import { usePlayback } from "@features/playback";
import { Play } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppMode } from "@/hooks/AppModeContext";
import { client } from "@/lib/api-client";

export function RunSimulationButton() {
  const { blueprint } = useBuilder();
  const { setRecording, setSimulationName, seek, play, pause } = usePlayback();
  const { switchToSimulation } = useAppMode();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunSimulation = async () => {
    if (!blueprint || isRunning) {
      return;
    }

    try {
      setIsRunning(true);
      // Ensure playback is reset before starting a new run
      pause();
      seek(0);

      const { data, error } = await client.POST("/api/simulate", {
        body: blueprint,
      });

      if (error) {
        console.error("Failed to run simulation", error);
        return;
      }

      if (!data) {
        console.error("Simulation API did not return a recording");
        return;
      }

      setRecording(data);
      setSimulationName("Builder Simulation");
      seek(0);
      play();

      // Switch the app into simulation mode via shared context
      switchToSimulation();
    } catch (err) {
      console.error("Unexpected error while running simulation", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      onClick={handleRunSimulation}
      disabled={!blueprint || isRunning}
      className="w-full"
    >
      <Play className="mr-2 h-4 w-4" />
      {isRunning ? "Running Simulation..." : "Run Simulation"}
    </Button>
  );
}
