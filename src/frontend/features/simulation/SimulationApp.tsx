"use client";

import { Application } from "@pixi/react";
import { useRef, useState } from "react";
import { SimulationScene } from "./SimulationScene";

export default function SimulationApp() {
    const parentRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh" }}>
            <div ref={parentRef} style={{ flex: 1, minHeight: 0, width: "100%" }}>
                <Application background={"#1099bb"} resizeTo={parentRef}>
                    <SimulationScene isPlaying={isPlaying} speed={speed} />
                </Application>
            </div>
            <div style={{
                padding: "10px",
                display: "flex",
                gap: "20px",
                justifyContent: "center",
                alignItems: "center",
                background: "#f0f0f0",
                borderTop: "1px solid #ccc"
            }}>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                        padding: "8px 16px",
                        fontSize: "16px",
                        cursor: "pointer"
                    }}
                >
                    {isPlaying ? "Pause" : "Play"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label htmlFor="speed-select">Speed:</label>
                    <select
                        id="speed-select"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        style={{ padding: "5px", fontSize: "14px" }}
                    >
                        <option value={0.1}>0.1x</option>
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={5}>5x</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
