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
 * PlaybackProvider - Core simulation playback state and controls.
 *
 * This provider manages recording state and exposes a memoized PlaybackClock
 * instance for time management. The clock handles RAF internally, avoiding
 * React re-renders on every frame.
 */
export const PlaybackProvider = ({ children }: { children: ReactNode }) => {
  const [simulationName, setSimulationName] = useState("Upload Simulation");
  const [recording, setRecording] = useState<SimulationRecording | null>(null);

  // Compute duration from recording
  const duration = recording?.duration || 0;
  const hasRecording = Object.keys(recording?.motion_segments_by_entity ?? {}).length > 0;
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
