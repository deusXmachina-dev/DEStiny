"use client";

import { useCallback } from "react";

import { useFileUpload } from "@/hooks/useFileUpload";

import { parseRecording } from "../utils";
import { usePlayback } from "./PlaybackContext";

export function useRecordingUpload() {
    const { setRecording, pause } = usePlayback();

    const handleUpload = useCallback((_file: File, content: string) => {
        const parsed = parseRecording(content);
        if (parsed) {
            setRecording(parsed);
            pause();
        }
    }, [setRecording, pause]);

    const { triggerFileUpload } = useFileUpload({
        acceptFileTypes: ".json",
        onSuccess: handleUpload,
    });

    return { triggerUpload: triggerFileUpload };
}

