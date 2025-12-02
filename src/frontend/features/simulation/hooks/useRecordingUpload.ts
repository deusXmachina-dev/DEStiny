import { useCallback } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSimulationController } from "./SimulationContext";
import { parseRecording } from "../utils";

export function useRecordingUpload() {
    const { setRecording, setSimulationName, pause } = useSimulationController();

    const handleUpload = useCallback((file: File, content: string) => {
        const parsed = parseRecording(content);
        if (parsed) {
            setRecording(parsed);
            setSimulationName(file.name);
            pause();
        }
    }, [setRecording, setSimulationName, pause]);

    const { triggerFileUpload } = useFileUpload({
        acceptFileTypes: ".json",
        onSuccess: handleUpload,
    });

    return { triggerUpload: triggerFileUpload };
}

