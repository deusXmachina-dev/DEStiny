"use client";

import { Application } from "@pixi/react";
import { useRef } from "react";
import { SimulationScene } from "./SimulationScene";
import { SimulationProvider, useSimulationController } from "./SimulationContext";
import { UploadControls } from "./UploadControls";
import { PlaybackControls } from "./PlaybackControls";

function SimulationAppContent() {
    const parentRef = useRef<HTMLDivElement>(null);
    const { history } = useSimulationController();
    
    // Dynamic positioning: center & large when no history, top-right & small when history exists
    const hasHistory = history.length > 0;

    return (
        <div className="flex flex-col w-full h-screen">
            <div ref={parentRef} className="flex-1 min-h-0 w-full relative">
                <Application background={"#1099bb"} resizeTo={parentRef}>
                    <SimulationScene />
                </Application>
                {/* Dynamic Upload Controls */}
                <UploadControls 
                    position={hasHistory ? "top-right" : "center"} 
                    size={hasHistory ? "sm" : "lg"} 
                />
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-gray-100 border-t border-gray-300 shadow-lg">
                <div className="p-4 max-w-7xl mx-auto">
                    <PlaybackControls disabled={!hasHistory} />
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
