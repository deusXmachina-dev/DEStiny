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

// Helper function to format time as MM:SS
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function SimulationAppContent() {
    const parentRef = useRef<HTMLDivElement>(null);
    const { isPlaying, speed, simulationName, currentTime, duration, togglePlay, setSpeed, setHistory, setSimulationName, pause, seek } = useSimulationController();
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

    return (
        <div className="flex flex-col w-full h-screen">
            <div ref={parentRef} className="flex-1 min-h-0 w-full">
                <Application background={"#1099bb"} resizeTo={parentRef}>
                    <SimulationScene />
                </Application>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-gray-100 border-t border-gray-300 shadow-lg">
                <div className="space-y-3 p-4 max-w-7xl mx-auto">
                    {/* First Row: 2 Columns - Upload & Controls */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Left Column: Upload & Simulation Name */}
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={triggerFileUpload}
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

                    {/* Second Row: Timeline Scrubber */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-900 font-medium min-w-[50px]">
                            {formatTime(currentTime)}
                        </span>
                        <Slider
                            id="timeline-slider"
                            value={[currentTime]}
                            min={0}
                            max={duration || 1}
                            step={0.01}
                            onValueChange={(vals) => seek(vals[0])}
                            className="flex-1 **:data-[slot=slider-track]:bg-gray-300 **:data-[slot=slider-range]:bg-blue-600"
                        />
                        <span className="text-gray-900 font-medium min-w-[50px]">
                            {formatTime(duration)}
                        </span>
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
