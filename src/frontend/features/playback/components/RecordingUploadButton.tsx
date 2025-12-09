"use client";

import { Upload } from "lucide-react";
import { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useRecordingUpload } from "../hooks/useRecordingUpload";

type RecordingUploadButtonProps = ComponentProps<typeof Button>;

export function RecordingUploadButton({
  className,
  ...props
}: RecordingUploadButtonProps) {
  const { triggerUpload } = useRecordingUpload();

  return (
    <Button
      onClick={triggerUpload}
      className={cn("gap-2 transition-all", className)}
      {...props}
    >
      <Upload className="size-4" />
      Upload Recording
    </Button>
  );
}
