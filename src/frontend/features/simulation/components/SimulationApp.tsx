"use client";

import { Application } from "@pixi/react";
import { useRef } from "react";
import { Scene } from "./pixi/Scene";
import { usePlayback } from "@features/playback";
import { SimulationProvider, useSimulation } from "../hooks/SimulationContext";
import { SimulationControls } from "./SimulationControls";
import { Background } from "./pixi/Background";

function SimulationAppContent() {
    const parentRef = useRef<HTMLDivElement>(null);
    const { hasRecording } = usePlayback();
    const { theme } = useSimulation();
    
    // Dynamic positioning: center & large when no recording, top-right & small when recording exists

    return (
        <div ref={parentRef} className="w-full h-full relative">
            <Application resizeTo={parentRef}>
                <Background theme={theme}/>
                <Scene />
            </Application>
            {/* Simulation Controls */}
            { /* TODO: This should be moved to the parent component */ }
            <SimulationControls position={hasRecording ? "top" : "center"} />
        </div>
    );
}

export default function SimulationApp() {
    return (
        <SimulationProvider>
            <SimulationAppContent />
        </SimulationProvider>
    );
}

