"use client";

import { RecordingUploadButton } from "@features/playback";
import { ThemeSelector } from "@features/visualization/components/ThemeSelector";
import { Plus,X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ControlsPosition = "top" | "center";

interface SimulationControlsProps {
    position?: ControlsPosition;
}

const POSITION_STYLES: Record<ControlsPosition, string> = {
  "top": "top-4 left-1/2 -translate-x-1/2",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

/**
 * SimulationControls - UI overlay for recording upload and theme selection.
 * 
 * This component uses:
 * - RecordingUploadButton (from playback feature)
 * - ThemeSelector (simulation-specific)
 * 
 * Must be used within both PlaybackProvider and SimulationProvider.
 */
export function SimulationControls({ 
  position = "top", 
}: SimulationControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isCenter = position === "center";

  if (isCenter) {
    return (
      <Card className={cn(
        "absolute z-10 shadow-2xl transition-all min-w-[320px]",
        "animate-in fade-in zoom-in-95 duration-300",
        POSITION_STYLES[position]
      )}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            Simulation Viewer
          </CardTitle>
          <CardDescription>
            Upload a recording to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordingUploadButton className="w-full" />
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeSelector />
        </CardFooter>
      </Card>
    );
  }

  // Collapsed state - floating circle button
  if (isCollapsed) {
    return (
      <Button
        size="icon-sm"
        variant="outline"
        onClick={() => setIsCollapsed(false)}
        className={cn(
          "absolute z-10 rounded-full shadow-lg",
          "animate-in fade-in zoom-in-50 duration-200",
          POSITION_STYLES[position]
        )}
        title="Expand controls"
      >
        <Plus className="size-5" />
      </Button>
    );
  }

  // Expanded state
  return (
    <div className={cn(
      "absolute z-10 bg-background rounded-full shadow-lg border transition-all",
      "animate-in fade-in slide-in-from-top-2 duration-200",
      POSITION_STYLES[position]
    )}>
      <div className="flex flex-row items-center gap-3 pl-4 pr-1 py-1">
        <RecordingUploadButton size="sm" />
        <ThemeSelector />
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setIsCollapsed(true)}
          className={cn(
            "rounded-full",
            "active:scale-90"
          )}
          title="Collapse controls"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

