import { useEffect, useMemo } from "react";
import { useSimulationController } from "../../hooks/SimulationContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { parseRecording } from "../../utils";
import { cn } from "@/lib/utils";
import { SimulationBackgroundTheme, SIMULATION_BACKGROUND_THEME_CONFIGS } from "../../constants";

type SimulationControlsPosition = "top-right" | "center";
type SimulationControlsSize = "sm" | "lg";

interface SimulationControlsProps {
    position?: SimulationControlsPosition;
    size?: SimulationControlsSize;
}

const POSITION_CLASSES: Record<SimulationControlsPosition, string> = {
    "top-right": "top-4 right-4",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

const THEME_OPTIONS: { value: SimulationBackgroundTheme; label: string }[] = Object.keys(SIMULATION_BACKGROUND_THEME_CONFIGS).map(
    (key) => ({
        value: key as SimulationBackgroundTheme,
        label: key.charAt(0).toUpperCase() + key.slice(1),
    })
);

export function SimulationControls({ position = "top-right", size = "sm" }: SimulationControlsProps) {
    const { setRecording, setSimulationName, pause, simulationName, theme, setTheme } = useSimulationController();
    const { fileName, fileContent, triggerFileUpload } = useFileUpload({ acceptFileTypes: ".json" });

    // Parse file content and update context when file is uploaded
    const parsedRecording = useMemo(() => {
        if (fileContent) {
            return parseRecording(fileContent);
        }
        return null;
    }, [fileContent]);

    useEffect(() => {
        if (parsedRecording && fileName) {
            setRecording(parsedRecording);
            setSimulationName(fileName);
            pause();
        }
    }, [parsedRecording, fileName, setRecording, setSimulationName, pause]);

    const isLarge = size === "lg";

    return (
        <div className={cn(
            "absolute z-10 bg-background rounded-lg shadow-lg border transition-all",
            POSITION_CLASSES[position],
            isLarge ? [
                "p-8 border-gray-400 shadow-2xl",
                "animate-in fade-in zoom-in-95 duration-300"
            ] : [
                "p-4 border-gray-300"
            ]
        )}>
            <div className={cn(
                "flex flex-col",
                isLarge ? "gap-5" : "gap-3"
            )}>
                {/* Upload Button */}
                <Button
                    onClick={triggerFileUpload}
                    className={cn(
                        "gap-2 transition-all w-full",
                        isLarge ? "text-lg py-6 px-8" : ""
                    )}
                >
                    <Upload className={cn(isLarge ? "size-6" : "size-4")} />
                    Upload Recording
                </Button>

                {/* Background Theme Select */}
                <div className={cn("flex flex-col", isLarge ? "gap-2" : "gap-1")}>
                    <label className={cn(
                        "text-gray-600 font-medium",
                        isLarge ? "text-sm" : "text-xs"
                    )}>
                        Background
                    </label>
                    <Select value={theme} onValueChange={(value) => setTheme(value as SimulationBackgroundTheme)}>
                        <SelectTrigger className={cn("w-full", isLarge ? "h-11" : "")}>
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                            {THEME_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Simulation Name */}
                <div className={cn(
                    "text-gray-900 font-semibold text-center truncate",
                    isLarge ? "text-base" : "text-sm"
                )}>
                    {simulationName}
                </div>
            </div>
        </div>
    );
}

