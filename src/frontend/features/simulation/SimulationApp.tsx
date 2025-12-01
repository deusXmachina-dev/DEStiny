"use client";

import { Application } from "@pixi/react";
import { useRef, useEffect, useMemo } from "react";
import { SimulationScene } from "./SimulationScene";
import { SimulationProvider, useSimulationController } from "./SimulationContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Play, Pause } from "lucide-react";
import { SimulationSnapshot } from "./types";
import dummyHistory from "./dummySimulationHistory.json";

function SimulationAppContent() {
    const parentRef = useRef<HTMLDivElement>(null);
    const { isPlaying, speed, simulationName, togglePlay, setSpeed, setHistory, setSimulationName, pause } = useSimulationController();
    const { fileName, fileContent, triggerFileUpload } = useFileUpload({ acceptFileTypes: ".json" });

    // Parse file content and update context when file is uploaded
    const parsedHistory = useMemo<SimulationSnapshot[] | null>(() => {
        if (fileContent) {
            try {
                const parsed = JSON.parse(fileContent);
                return parsed as SimulationSnapshot[];
            } catch (error) {
                console.error("Failed to parse file content:", error);
                return null;
            }
        }
        return null;
    }, [fileContent]);

    useEffect(() => {
        if (parsedHistory && fileName) {
            setHistory(parsedHistory);
            setSimulationName(fileName);
            pause();
        }
    }, [parsedHistory, fileName, setHistory, setSimulationName, pause]);

    const handleUpload = () => {
        triggerFileUpload();
    };

    return (
        <div className="flex flex-col w-full h-screen">
            <div ref={parentRef} className="flex-1 min-h-0 w-full">
                <Application background={"#1099bb"} resizeTo={parentRef}>
                    <SimulationScene />
                </Application>
            </div>

            {/* Bottom Navigation Bar - 2 Columns */}
            <div className="bg-gray-100 border-t border-gray-300 shadow-lg">
                <div className="grid grid-cols-2 gap-8 p-4 max-w-7xl mx-auto">
                    {/* Left Column: Upload & Simulation Name */}
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleUpload}
                            variant="outline"
                            size="default"
                            className="gap-2 bg-gray-800 border-gray-700 text-white"
                        >
                            <Upload className="size-4" />
                            Upload History
                        </Button>
                        <span className="text-gray-900 font-semibold">{simulationName}</span>
                    </div>

                    {/* Right Column: Playback Controls */}
                    <div className="flex items-center justify-end gap-6">
                        <Button
                            onClick={togglePlay}
                            variant="outline"
                            size="default"
                            className="gap-2 bg-gray-800 border-gray-700 text-white min-w-[110px]"
                        >
                            {isPlaying ? (
                                <>
                                    <Pause className="size-4" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="size-4" />
                                    Play
                                </>
                            )}
                        </Button>

                        <div className="flex items-center gap-3 min-w-[280px]">
                            <Label htmlFor="speed-slider" className="text-gray-900 font-medium min-w-[90px]">
                                Speed: {speed.toFixed(1)}x
                            </Label>
                            <Slider
                                id="speed-slider"
                                value={[speed]}
                                min={0.1}
                                max={5}
                                step={0.1}
                                onValueChange={(vals) => setSpeed(vals[0])}
                                className="flex-1 **:data-[slot=slider-track]:bg-gray-300 **:data-[slot=slider-range]:bg-gray-700"
                            />
                        </div>
                    </div>
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
