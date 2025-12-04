"use client";

import { RecordingUploadButton } from "@features/playback";
import { Plus,X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { ThemeSelector } from "./ThemeSelector";

type ControlsPosition = "top" | "center";

interface SimulationControlsProps {
    position?: ControlsPosition;
}

const POSITION_STYLES: Record<ControlsPosition, string> = {
    "top": "top-4 left-1/2 -translate-x-1/2",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

/**
 * SimulationControls - UI overlay for recording upload and theme selection.
 * 
 * This component uses:
 * - RecordingUploadButton (from playback feature)
 * - ThemeSelector (simulation-specific)
 * 
 * Must be used within both PlaybackProvider and SimulationProvider.
 */
export function SimulationControls({ 
    position = "top", 
}: SimulationControlsProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isCenter = position === "center";

    if (isCenter) {
        return (
            <div className={cn(
                "absolute z-10 bg-background rounded-2xl shadow-2xl border border-gray-200 transition-all",
                "animate-in fade-in zoom-in-95 duration-300",
                POSITION_STYLES[position]
            )}>
                <div className="flex flex-col gap-5 p-8 min-w-[320px]">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Simulation Viewer
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Upload a recording to get started
                        </p>
                    </div>
                    <RecordingUploadButton />
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Theme</span>
                        <ThemeSelector />
                    </div>
                </div>
            </div>
        );
    }

    // Collapsed state - floating circle button
    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className={cn(
                    "absolute z-10 size-10 rounded-full bg-background/60 backdrop-blur-sm shadow-lg",
                    "flex items-center justify-center",
                    "hover:scale-110 hover:shadow-xl active:scale-95",
                    "transition-all duration-200 ease-out",
                    "animate-in fade-in zoom-in-50 duration-200",
                    POSITION_STYLES[position]
                )}
                title="Expand controls"
            >
                <Plus className="size-5 text-gray-600" />
            </button>
        );
    }

    // Expanded state
    return (
        <div className={cn(
            "absolute z-10 bg-background rounded-full shadow-lg border transition-all",
            "animate-in fade-in slide-in-from-top-2 duration-200",
            POSITION_STYLES[position]
        )}>
            <div className="flex flex-row items-center gap-3 pl-4 pr-1 py-1">
                <RecordingUploadButton />
                <ThemeSelector />
                <button
                    onClick={() => setIsCollapsed(true)}
                    className={cn(
                        "size-8 rounded-full flex items-center justify-center",
                        "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                        "transition-all duration-150",
                        "active:scale-90"
                    )}
                    title="Collapse controls"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}

