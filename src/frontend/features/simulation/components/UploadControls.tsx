import { useEffect, useMemo } from "react";
import { useSimulationController } from "../hooks/SimulationContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { parseRecording } from "../utils";
import { cn } from "@/lib/utils";

type UploadControlsPosition = "top-right" | "center";
type UploadControlsSize = "sm" | "lg";

interface UploadControlsProps {
    position?: UploadControlsPosition;
    size?: UploadControlsSize;
}

const POSITION_CLASSES: Record<UploadControlsPosition, string> = {
    "top-right": "top-4 right-4",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function UploadControls({ position = "top-right", size = "sm" }: UploadControlsProps) {
    const { setRecording, setSimulationName, pause, simulationName } = useSimulationController();
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
            "absolute z-10 bg-white rounded-lg shadow-lg border transition-all",
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
                isLarge ? "gap-6" : "gap-3"
            )}>
                <Button
                    onClick={triggerFileUpload}
                    variant="outline"
                    className={cn(
                        "gap-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 transition-all",
                        isLarge ? "text-lg py-6 px-8" : "size-default"
                    )}
                >
                    <Upload className={cn(isLarge ? "size-6" : "size-4")} />
                    Upload Recording
                </Button>
                <div className={cn(
                    "text-gray-900 font-semibold text-center",
                    isLarge ? "text-lg" : "text-sm"
                )}>
                    {simulationName}
                </div>
                {isLarge && (
                    <div className="text-gray-600 text-sm text-center max-w-xs">
                        Drop your simulation JSON file to get started
                    </div>
                )}
            </div>
        </div>
    );
}

