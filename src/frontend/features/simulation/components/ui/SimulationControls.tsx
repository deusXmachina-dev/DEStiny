import { cn } from "@/lib/utils";
import { RecordingUploadButton } from "./RecordingUploadButton";
import { ThemeSelector } from "./ThemeSelector";

type SimulationControlsPosition = "top" | "center";

interface SimulationControlsProps {
    position?: SimulationControlsPosition;
}

const POSITION_STYLES: Record<SimulationControlsPosition, string> = {
    "top": "top-4 left-1/2 -translate-x-1/2",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function SimulationControls({ 
    position = "top", 
}: SimulationControlsProps) {
    return (
        <div className={cn("absolute z-10 bg-background rounded-full shadow-lg border transition-all", POSITION_STYLES[position])}>
            <div className={"flex flex-row items-center gap-4 mx-4 my-1"}>
                <RecordingUploadButton />
                <ThemeSelector />
            </div>
        </div>
    );
}
