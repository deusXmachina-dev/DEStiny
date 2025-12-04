"use client";

import { useEffect, useRef } from "react";

import { usePlayback } from "./PlaybackContext";

/**
 * usePlaybackTicker - Headless time advancement hook.
 * 
 * Uses requestAnimationFrame to advance currentTime based on speed when playing.
 * This hook works WITHOUT PixiJS and can be used in any context that needs
 * time-synchronized updates (metrics graphs, data tables, etc.).
 * 
 * Must be used within a PlaybackProvider.
 */
export const usePlaybackTicker = () => {
    const { isPlaying, speed, duration, seekTarget, setCurrentTime, clearSeekTarget } = usePlayback();
    
    const accumulatedTimeRef = useRef<number>(0);
    const lastTimestampRef = useRef<number | null>(null);
    const rafIdRef = useRef<number | null>(null);

    // Handle seek target - update accumulated time when user seeks
    useEffect(() => {
        if (seekTarget !== null) {
            accumulatedTimeRef.current = seekTarget * 1000; // Convert to ms
            lastTimestampRef.current = null; // Reset timestamp to avoid jump
            clearSeekTarget();
        }
    }, [seekTarget, clearSeekTarget]);

    // Main animation loop
    useEffect(() => {
        if (!isPlaying) {
            // Clean up when paused
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            lastTimestampRef.current = null;
            return;
        }

        const tick = (timestamp: number) => {
            if (lastTimestampRef.current !== null) {
                const deltaMs = timestamp - lastTimestampRef.current;
                accumulatedTimeRef.current += deltaMs * speed;

                const durationMs = duration * 1000;
                if (accumulatedTimeRef.current > durationMs) {
                    accumulatedTimeRef.current = durationMs;
                }

                const simTimeSeconds = accumulatedTimeRef.current / 1000;
                setCurrentTime(simTimeSeconds);
            }

            lastTimestampRef.current = timestamp;
            rafIdRef.current = requestAnimationFrame(tick);
        };

        rafIdRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [isPlaying, speed, duration, setCurrentTime]);

    // Reset when duration changes (new recording loaded)
    useEffect(() => {
        accumulatedTimeRef.current = 0;
        lastTimestampRef.current = null;
        setCurrentTime(0);
    }, [duration, setCurrentTime]);
};

