"use client";

import { useEffect, useRef, useState } from "react";

import { usePlayback } from "./PlaybackContext";

interface PlaybackState {
  time: number;
  isPlaying: boolean;
  speed: number;
}

/**
 * Hook that polls PlaybackClock for current playback state.
 *
 * Uses separate state for time, isPlaying, and speed to minimize re-renders.
 * Time changes frequently, while isPlaying and speed change rarely.
 *
 * @param intervalMs - Poll interval in milliseconds (default: 100ms)
 * @returns Current playback state { time, isPlaying, speed }
 */
export function usePlaybackState(intervalMs = 100): PlaybackState {
  const { clock } = usePlayback();

  // Separate states for independent updates
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Track last values to detect changes
  const lastTimeRef = useRef(0);
  const lastIsPlayingRef = useRef(false);
  const lastSpeedRef = useRef(1);

  useEffect(() => {
    // Read and update state
    const updateState = () => {
      const currentTime = clock.getTime();
      const currentIsPlaying = clock.isPlaying();
      const currentSpeed = clock.getSpeed();

      // Update each state independently if changed
      if (currentTime !== lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        setTime(currentTime);
      }

      if (currentIsPlaying !== lastIsPlayingRef.current) {
        lastIsPlayingRef.current = currentIsPlaying;
        setIsPlaying(currentIsPlaying);
      }

      if (currentSpeed !== lastSpeedRef.current) {
        lastSpeedRef.current = currentSpeed;
        setSpeed(currentSpeed);
      }
    };

    // Initial read
    updateState();

    // Poll at interval
    const interval = setInterval(updateState, intervalMs);

    return () => clearInterval(interval);
  }, [clock, intervalMs]);

  return { time, isPlaying, speed };
}
