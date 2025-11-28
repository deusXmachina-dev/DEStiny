"use client";

import { Application } from "@pixi/react";
import { useRef, useState } from "react";
import { SimulationScene } from "./SimulationScene";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function SimulationApp() {
    const parentRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState("1");

    return (
        <div className="flex flex-col w-full h-screen">
            <div ref={parentRef} className="flex-1 min-h-0 w-full">
                <Application background={"#1099bb"} resizeTo={parentRef}>
                    <SimulationScene isPlaying={isPlaying} speed={Number(speed)} />
                </Application>
            </div>
            <div className="p-4 flex gap-5 justify-center items-center bg-muted border-t">
                <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant="default"
                >
                    {isPlaying ? "Pause" : "Play"}
                </Button>

                <div className="flex items-center gap-3">
                    <Label htmlFor="speed-select">Speed:</Label>
                    <Select value={speed} onValueChange={setSpeed}>
                        <SelectTrigger id="speed-select" className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0.1">0.1x</SelectItem>
                            <SelectItem value="0.5">0.5x</SelectItem>
                            <SelectItem value="1">1x</SelectItem>
                            <SelectItem value="2">2x</SelectItem>
                            <SelectItem value="5">5x</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
