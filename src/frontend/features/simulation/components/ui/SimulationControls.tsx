import { cn } from "@/lib/utils";
import { RecordingUploadButton, ControlSize } from "./RecordingUploadButton";
import { ThemeSelector } from "./ThemeSelector";
import { SimulationNameDisplay } from "./SimulationNameDisplay";

type SimulationControlsPosition = "top" | "center";

interface SimulationControlsProps {
    position?: SimulationControlsPosition;
    size?: ControlSize;
}

const POSITION_STYLES: Record<SimulationControlsPosition, string> = {
    "top-right": "top-4 right-4",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

const SIZE_STYLES = {
    sm: {
        panel: "p-4 border-gray-300",
        gap: "gap-3",
    },
    lg: {
        panel: "p-8 border-gray-400 shadow-2xl animate-in fade-in zoom-in-95 duration-300",
        gap: "gap-5",
    },
} as const;

export function SimulationControls({ 
    position = "top-right", 
    size = "sm" 
}: SimulationControlsProps) {
    const styles = SIZE_STYLES[size];

    return (
        <div className={cn(
            "absolute z-10 bg-background rounded-lg shadow-lg border transition-all",
            POSITION_STYLES[position],
            styles.panel
        )}>
            <div className={cn("flex flex-col", styles.gap)}>
                <SimulationNameDisplay size={size} />
                <RecordingUploadButton size={size} />
                <ThemeSelector size={size} />
            </div>
        </div>
    );
}
