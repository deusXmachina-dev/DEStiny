"use client";

import { formatTime } from "@lib/utils";
import { FastForward, Pause, Play, Rewind } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { SPEED_OPTIONS } from "../constants";
import { usePlayback } from "../hooks/PlaybackContext";

export function PlaybackControls() {
  const {
    isPlaying,
    speed,
    togglePlay,
    setSpeed,
    seek,
    currentTime,
    duration,
    hasRecording,
  } = usePlayback();

  const disabled = !hasRecording;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-4 w-full">
        {/* Left: Control Buttons */}
        <div className="flex items-center gap-2">
          <Button
            disabled={disabled}
            onClick={() => seek(0)}
            size="icon"
            className="size-9"
            title="Seek to start"
          >
            <Rewind className="size-4" />
          </Button>
          <Button
            onClick={togglePlay}
            size="icon"
            className="size-9"
            title="Play/Pause"
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
          <Button
            disabled={disabled}
            onClick={() => seek(duration)}
            size="icon"
            className="size-9"
            title="Seek to end"
          >
            <FastForward className="size-4" />
          </Button>
        </div>

        {/* Center: Timeline */}
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm min-w-[45px] font-mono">
            {formatTime(currentTime)}
          </span>
          <Slider
            disabled={disabled}
            id="timeline-slider"
            value={[currentTime]}
            min={0}
            max={duration || 1}
            step={0.01}
            onValueChange={(vals) => {
              if (vals[0] !== undefined) {
                seek(vals[0]);
              }
            }}
            className="flex-1"
          />
          <span className="text-sm min-w-[45px] font-mono">
            {formatTime(duration)}
          </span>
        </div>

        {/* Right: Speed Select */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium font-mono">Speed:</span>
          <Select
            disabled={disabled}
            value={speed.toString()}
            onValueChange={(val) => setSpeed(parseFloat(val))}
          >
            <SelectTrigger className="w-[90px] font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
