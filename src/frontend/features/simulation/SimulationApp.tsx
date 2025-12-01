"use client";

import { Application } from "@pixi/react";
import { useRef, useState } from "react";
import { SimulationScene } from "./SimulationScene";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function SimulationApp() {
    const parentRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);

    return (
        <div className="flex flex-col w-full h-screen">
            <div ref={parentRef} className="flex-1 min-h-0 w-full">
                <Application background={"#1099bb"} resizeTo={parentRef}>
                    <SimulationScene isPlaying={isPlaying} speed={speed} />
                </Application>
            </div>
            <div className="p-4 flex gap-5 justify-center items-center bg-muted border-t">
                <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant="default"
                >
                    {isPlaying ? "Pause" : "Play"}
                </Button>

                <div className="flex items-center gap-4 w-[300px]">
                    <Label htmlFor="speed-slider" className="min-w-[80px]">Speed: {speed.toFixed(1)}x</Label>
                    <Slider
                        id="speed-slider"
                        value={[speed]}
                        min={0.1}
                        max={5}
                        step={0.1}
                        onValueChange={(vals) => setSpeed(vals[0])}
                    />
                </div>
            </div>
        </div>
    );
}
