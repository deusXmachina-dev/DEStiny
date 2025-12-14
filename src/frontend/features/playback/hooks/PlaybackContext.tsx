"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { setDefaultWithDevOverride } from "@/lib/utils";

import { PlaybackClock } from "../PlaybackClock";
import { SimulationRecording } from "../types";

interface PlaybackContextValue {
  // State (React-managed)
  recording: SimulationRecording | null;
  hasRecording: boolean;
  simulationName: string;
  duration: number;

  // Actions
  setRecording: (recording: SimulationRecording | null) => void;
  setSimulationName: (name: string) => void;

  // Clock instance (all time/playback methods)
  clock: PlaybackClock;
}

const PlaybackContext = createContext<PlaybackContextValue | undefined>(
  undefined,
);

/**
 * Get initial recording from dummy data if in development mode.
 * Uses dynamic require to avoid bundling dummy data in production.
 * Controlled by NEXT_PUBLIC_DEV_RECORDING env variable.
 */
function getInitialRecording(): {
  recording: SimulationRecording | null;
  name: string;
} {
  if (process.env.NODE_ENV !== "development") {
    return { recording: null, name: "Upload Simulation" };
  }

  const devRecording = process.env.NEXT_PUBLIC_DEV_RECORDING;
  if (!devRecording) {
    return { recording: null, name: "Upload Simulation" };
  }

  // Only import dummy data in development to keep it out of production bundle
  try {
    // Dynamic import for development-only data

    const recordingData = require(`@/${devRecording}`);
    return {
      recording: recordingData as SimulationRecording,
      name: "Dummy Recording",
    };
  } catch (error) {
    // Fallback if dummy data is not available
    console.warn(`Failed to load dev recording: ${devRecording}`, error);
    return { recording: null, name: "Upload Simulation" };
  }
}

/**
 * PlaybackProvider - Core simulation playback state and controls.
 *
 * This provider manages recording state and exposes a memoized PlaybackClock
 * instance for time management. The clock handles RAF internally, avoiding
 * React re-renders on every frame.
 */
export const PlaybackProvider = ({ children }: { children: ReactNode }) => {
  const [simulationName, setSimulationName] = useState(
    () => getInitialRecording().name,
  );
  const [recording, setRecording] = useState<SimulationRecording | null>(
    () => getInitialRecording().recording,
  );

  // Compute duration from recording
  const duration = recording?.duration || 0;
  const hasRecording = recording !== null;

  // Memoized clock - stable reference for the lifetime of the provider
  const clock = useMemo(() => {
    const c = new PlaybackClock();
    // Set initial speed (different in dev vs prod)
    c.setSpeed(setDefaultWithDevOverride(1, 20));
    return c;
  }, []);

  // Sync duration to clock when recording changes
  useEffect(() => {
    clock.setDuration(duration);
    clock.reset();
  }, [clock, duration]);

  // Cleanup on unmount
  useEffect(() => () => clock.dispose(), [clock]);

  const value: PlaybackContextValue = {
    recording,
    hasRecording,
    simulationName,
    duration,
    setRecording,
    setSimulationName,
    clock,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
};

/**
 * Hook to access playback state and controls.
 * Can be used by any component that needs playback functionality.
 */
export const usePlayback = (): PlaybackContextValue => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
};

// Export types for external use
export type { PlaybackContextValue };
