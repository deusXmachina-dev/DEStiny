"use client";

import { Application, extend, useTick } from "@pixi/react";
import { Assets, Container, Sprite, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";

// Extend Pixi.js components for @pixi/react
extend({
    Container,
    Sprite,
});

// --- 1. Types & Mock Data ---

interface Pose {
    simTime: number; // Simulation time in milliseconds
    x: number;
    y: number;
}

const SIMULATION_DURATION = 2000; // 2 seconds

// Hardcoded buffer of poses (sparse updates)
const MOCK_POSES: Pose[] = [
    { simTime: 0, x: 100, y: 300 },
    { simTime: 500, x: 300, y: 300 },
    { simTime: 1000, x: 500, y: 300 },
    { simTime: 1500, x: 700, y: 300 },
    { simTime: 2000, x: 900, y: 300 },
];

// --- Helpers ---

/**
 * Linear interpolation helper.
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor (0-1)
 */
const lerp = (a: number, b: number, t: number) => {
    return a + (b - a) * t;
};

const SimulationObject = () => {
    const spriteRef = useRef<Sprite>(null);
    const [texture, setTexture] = useState(Texture.EMPTY);

    // 3. Playback Clock State
    // We'll track the start of our playback in wall-clock time
    const playbackStartRef = useRef<number>(performance.now());

    // Load the bunny texture
    useEffect(() => {
        Assets.load("/assets/bunny.png").then((tex) => {
            setTexture(tex);
        });
    }, []);

    // 4. Render Tick
    useTick(() => {
        if (!spriteRef.current) return;

        // Current wall-clock time
        const now = performance.now();

        // Convert wall-clock to playback time (looping every 2s for demo purposes)
        // In a real app, this might be driven by a server clock or stream
        const elapsedWallTime = now - playbackStartRef.current;
        const currentSimTime = elapsedWallTime % SIMULATION_DURATION;

        // 4. Interpolate between nearest poses

        // Find the poses surrounding the current sim time
        // Since MOCK_POSES is sorted, we can iterate to find the segment
        let prevPose = MOCK_POSES[0];
        let nextPose = MOCK_POSES[MOCK_POSES.length - 1];

        for (let i = 0; i < MOCK_POSES.length - 1; i++) {
            const p1 = MOCK_POSES[i];
            const p2 = MOCK_POSES[i + 1];

            if (currentSimTime >= p1.simTime && currentSimTime < p2.simTime) {
                prevPose = p1;
                nextPose = p2;
                break;
            }
        }

        // Calculate interpolation factor (t)
        // Prevent division by zero if two poses have same time
        const timeRange = nextPose.simTime - prevPose.simTime;
        const t = timeRange > 0
            ? (currentSimTime - prevPose.simTime) / timeRange
            : 0;

        // 6. Apply interpolation (Lerp)
        const x = lerp(prevPose.x, nextPose.x, t);
        const y = lerp(prevPose.y, nextPose.y, t);

        // Update Sprite
        spriteRef.current.x = x;
        spriteRef.current.y = y;
    });

    return (
        <pixiSprite
            ref={spriteRef}
            texture={texture}
            anchor={0.5}
            // Initial position (will be overridden by ticker immediately)
            x={MOCK_POSES[0].x}
            y={MOCK_POSES[0].y}
        />
    );
};

export default function SimulationApp() {
    return (
        <Application background={"#1099bb"}>
            <SimulationObject />
        </Application>
    );
}
