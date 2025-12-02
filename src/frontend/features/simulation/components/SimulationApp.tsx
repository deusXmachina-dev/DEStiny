"use client";

import { Application } from "@pixi/react";
import { useRef } from "react";
import { SimulationScene } from "./pixi/SimulationScene";
import { SimulationProvider, useSimulationController } from "../hooks/SimulationContext";
import { UploadControls } from "./ui/UploadControls";
import { PlaybackControls } from "./ui/PlaybackControls";
import { SimulationBackground } from "./pixi/SimulationBackground";

function SimulationAppContent() {
    const parentRef = useRef<HTMLDivElement>(null);
    const { recording } = useSimulationController();
    
    // Dynamic positioning: center & large when no recording, top-right & small when recording exists
    const hasRecording = recording !== null;

    return (
        <div className="flex flex-col w-full h-screen">
            <div ref={parentRef} className="flex-1 min-h-0 w-full relative">
                <Application resizeTo={parentRef}>
                    <SimulationBackground theme="warehouse" gridSize={50}/>
                    <SimulationScene />
                </Application>
                {/* Dynamic Upload Controls */}
                <UploadControls 
                    position={hasRecording ? "top-right" : "center"} 
                    size={hasRecording ? "sm" : "lg"} 
                />
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-gray-100 border-t border-gray-300 shadow-lg">
                <div className="p-4 max-w-7xl mx-auto">
                    <PlaybackControls disabled={!hasRecording} />
                </div>
            </div>
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

