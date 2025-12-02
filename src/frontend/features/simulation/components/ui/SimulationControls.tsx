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

    return (
        <div className={cn(
            "absolute z-10 bg-background rounded-full shadow-lg border transition-all",
            POSITION_STYLES[position]
        )}>
            <div className="flex flex-row items-center gap-4 mx-4 my-1">
                <RecordingUploadButton />
                <ThemeSelector />
            </div>
        </div>
    );
}
