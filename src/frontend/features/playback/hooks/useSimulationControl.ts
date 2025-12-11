"use client";

import { useBuilder } from "@features/builder";
import { useState } from "react";

import { useAppState } from "@/hooks/AppStateContext";
import { $api } from "@/lib/api-client";

import { usePlayback } from "./PlaybackContext";

/**
 * Hook for controlling simulations and playback.
 * Handles running simulations, stopping playback, and resetting playback state.
 */
export function useSimulationControl() {
  const { blueprint } = useBuilder();
  const { setRecording, setSimulationName, seek, play, pause } = usePlayback();
  const { switchToSimulation, switchToBuilder } = useAppState();
  const [isFetchingSimulationResult, setIsFetchingSimulationResult] =
    useState(false);

  const mutation = $api.useMutation("post", "/api/simulate");

  const executeSimulation = async (autoPlay: boolean) => {
    if (!blueprint) {
      switchToSimulation();
      return;
    }
    if (isFetchingSimulationResult) {
      return;
    }

    try {
      setIsFetchingSimulationResult(true);
      // Ensure playback is reset before starting a new run
      pause();
      seek(0);

      const data = await mutation.mutateAsync({
        body: blueprint,
      });

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
      setIsFetchingSimulationResult(false);
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
    isFetchingSimulationResult,
  };
}
