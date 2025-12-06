"use client";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useRecordingUpload } from "../hooks/useRecordingUpload";

export function RecordingUploadButton() {
  const { triggerUpload } = useRecordingUpload();

  return (
    <Button
      onClick={triggerUpload}
      className="gap-2 transition-all"
    >
      <Upload className="size-4" />
            Upload Recording
    </Button>
  );
}

