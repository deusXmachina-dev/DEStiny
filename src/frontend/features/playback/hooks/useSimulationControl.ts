"use client";

import { useBuilder } from "@features/builder";
import { useState } from "react";

import { useAppMode } from "@/hooks/AppModeContext";
import { client } from "@/lib/api-client";

import { usePlayback } from "./PlaybackContext";

/**
 * Hook for controlling simulations and playback.
 * Handles running simulations, stopping playback, and resetting playback state.
 */
export function useSimulationControl() {
  const { blueprint } = useBuilder();
  const { setRecording, setSimulationName, seek, play, pause } = usePlayback();
  const { switchToSimulation, switchToBuilder } = useAppMode();
  const [isRunning, setIsRunning] = useState(false);

  const executeSimulation = async (autoPlay: boolean) => {
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

      if (autoPlay) {
        play();
      }

      // Switch the app into simulation mode via shared context
      switchToSimulation();
    } catch (err) {
      console.error("Unexpected error while running simulation", err);
    } finally {
      setIsRunning(false);
    }
  };

  const runSimulation = async () => executeSimulation(true);

  const loadSimulation = async () => executeSimulation(false);

  const stopAndSwitchToBuilder = () => {
    pause();
    seek(0);
    switchToBuilder();
  };

  return {
    runSimulation,
    loadSimulation,
    stopAndSwitchToBuilder,
    isRunning,
  };
}
