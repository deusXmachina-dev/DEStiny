import { cn } from "@/lib/utils";
import { RecordingUploadButton, ControlSize } from "./RecordingUploadButton";
import { ThemeSelector } from "./ThemeSelector";

type SimulationControlsPosition = "top" | "center";

interface SimulationControlsProps {
    position?: SimulationControlsPosition;
    size?: ControlSize;
}

const POSITION_STYLES: Record<SimulationControlsPosition, string> = {
    "top": "top-4 left-1/2 -translate-x-1/2",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

const SIZE_STYLES = {
    sm: {
        panel: "px-4 py-3 border-gray-300",
        gap: "gap-4",
    },
    lg: {
        panel: "px-6 py-4 border-gray-400 shadow-2xl animate-in fade-in zoom-in-95 duration-300",
        gap: "gap-5",
    },
} as const;

export function SimulationControls({ 
    position = "top", 
    size = "sm" 
}: SimulationControlsProps) {
    const styles = SIZE_STYLES[size];

    return (
        <div className={cn(
            "absolute z-10 bg-background rounded-full shadow-lg border transition-all",
            POSITION_STYLES[position],
            styles.panel
        )}>
            <div className={cn("flex flex-row items-center", styles.gap)}>
                <RecordingUploadButton size={size} />
                <ThemeSelector size={size} />
            </div>
        </div>
    );
}
