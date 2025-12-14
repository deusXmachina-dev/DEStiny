"use client";

import { useEffect, useState } from "react";

import { usePlayback } from "./PlaybackContext";

/**
 * useTimePolling - Hook for components that need periodic time updates.
 *
 * Polls the clock at the specified interval and returns the current time
 * as React state. Use this for UI components that need to display time
 * (sliders, charts, etc.) at a controlled frequency.
 *
 * @param intervalMs - Polling interval in milliseconds (default: 100ms = 10fps)
 * @returns Current simulation time in seconds
 */
export function useTimePolling(intervalMs = 100): number {
  const { clock } = usePlayback();
  const [time, setTime] = useState(() => clock.getTime());

  useEffect(() => {
    // Initial sync
    setTime(clock.getTime());

    // Poll at interval
    const id = setInterval(() => {
      setTime(clock.getTime());
    }, intervalMs);

    return () => clearInterval(id);
  }, [clock, intervalMs]);

  return time;
}
