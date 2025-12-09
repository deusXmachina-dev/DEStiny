"use client";

import { usePlaybackTicker } from "../hooks/usePlaybackTicker";

/**
 * PlaybackClock - Headless component that drives the playback timeline.
 *
 * This component mounts usePlaybackTicker which uses requestAnimationFrame
 * to advance currentTime. It renders nothing but ensures the playback clock
 * runs whenever the PlaybackProvider is mounted.
 */
export const PlaybackClock = () => {
  usePlaybackTicker();
  return null;
};
