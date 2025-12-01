"use client";

import { useEffect, useMemo } from "react";
import { useSimulationController } from "./SimulationContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { SimulationSnapshot } from "./types";

export function UploadControls() {
    const { setHistory, setSimulationName, pause, simulationName } = useSimulationController();
    const { fileName, fileContent, triggerFileUpload } = useFileUpload({ acceptFileTypes: ".json" });

    // Parse file content and update context when file is uploaded
    const parsedHistory = useMemo<SimulationSnapshot[] | null>(() => {
        if (fileContent) {
            try {
                const parsed = JSON.parse(fileContent);
                return parsed as SimulationSnapshot[];
            } catch (error) {
                console.error("Failed to parse file content:", error);
                return null;
            }
        }
        return null;
    }, [fileContent]);

    useEffect(() => {
        if (parsedHistory && fileName) {
            setHistory(parsedHistory);
            setSimulationName(fileName);
            pause();
        }
    }, [parsedHistory, fileName, setHistory, setSimulationName, pause]);

    return (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg border border-gray-300 p-4">
            <div className="flex flex-col gap-3">
                <Button
                    onClick={triggerFileUpload}
                    variant="outline"
                    size="default"
                    className="gap-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                    <Upload className="size-4" />
                    Upload History
                </Button>
                <div className="text-sm text-gray-900 font-semibold text-center">
                    {simulationName}
                </div>
            </div>
        </div>
    );
}

