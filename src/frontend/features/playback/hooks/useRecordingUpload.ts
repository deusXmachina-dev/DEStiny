"use client";

import { useCallback } from "react";

import { useFileUpload } from "@/hooks/useFileUpload";

import { parseRecording } from "../utils";
import { usePlayback } from "./PlaybackContext";

export function useRecordingUpload() {
  const { setRecording, clock, setSimulationName } = usePlayback();

  const handleUpload = useCallback(
    (_file: File, content: string) => {
      const parsed = parseRecording(content);
      const name = _file.name.split(".")[0];
      if (parsed) {
        setRecording(parsed);
        setSimulationName(name ?? "Uploaded Simulation");
        clock.pause();
      }
    },
    [setRecording, clock, setSimulationName],
  );

  const { triggerFileUpload } = useFileUpload({
    acceptFileTypes: ".json",
    onSuccess: handleUpload,
  });

  return { triggerUpload: triggerFileUpload };
}
