"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBuilder } from "../../hooks/BuilderContext";

export function SimulationMetaMenu() {
  const { blueprint, updateSimParams } = useBuilder();
  const [open, setOpen] = useState(false);
  const [initialTime, setInitialTime] = useState("0");
  const [duration, setDuration] = useState("");
  const [errors, setErrors] = useState<{ initialTime?: string; duration?: string }>({});

  useEffect(() => {
    const blueprintInitial = blueprint?.simParams?.initialTime ?? 0;
    const blueprintDuration = blueprint?.simParams?.duration;
    setInitialTime(String(blueprintInitial));
    setDuration(
      blueprintDuration === null || blueprintDuration === undefined
        ? ""
        : String(blueprintDuration),
    );
    setErrors({});
  }, [blueprint]);

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: { initialTime?: string; duration?: string } = {};

    const parsedInitial = Number(initialTime);
    if (Number.isNaN(parsedInitial)) {
      nextErrors.initialTime = "Enter a number (seconds).";
    } else if (parsedInitial < 0) {
      nextErrors.initialTime = "Cannot be negative.";
    }

    let parsedDuration: number | null | undefined = null;
    if (duration.trim() !== "") {
      const asNumber = Number(duration);
      if (Number.isNaN(asNumber)) {
        nextErrors.duration = "Enter a number (seconds) or leave blank.";
      } else if (asNumber <= 0) {
        nextErrors.duration = "Must be greater than 0 seconds.";
      } else {
        parsedDuration = asNumber;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    updateSimParams({
      initialTime: parsedInitial,
      duration: duration.trim() === "" ? null : parsedDuration,
    });
    setOpen(false);
  };

  return (
    <Select open={open} onOpenChange={setOpen}>
      <SelectTrigger className="w-auto gap-2">
        <Settings2 className="h-4 w-4" />
        <SelectValue placeholder="Configure" />
      </SelectTrigger>
      <SelectContent
        className="w-80"
        align="end"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2">
          <div className="text-sm font-semibold mb-3 px-2">
            Simulation Parameters
          </div>
          <form onSubmit={handleApply} className="space-y-3">
            <div>
              <Label htmlFor="meta-initial-time">Start time (seconds)</Label>
              <Input
                id="meta-initial-time"
                type="number"
                value={initialTime}
                onChange={(event) => setInitialTime(event.target.value)}
                min={0}
                className="mt-1"
              />
              {errors.initialTime ? (
                <p className="text-xs text-destructive mt-1">{errors.initialTime}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  When the simulation timeline begins.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="meta-duration">Duration (seconds)</Label>
              <Input
                id="meta-duration"
                type="number"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                min={0}
                placeholder="Leave empty for auto"
                className="mt-1"
              />
              {errors.duration ? (
                <p className="text-xs text-destructive mt-1">{errors.duration}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Optional. Leave blank to use recording duration.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Apply
              </Button>
            </div>
          </form>
        </div>
      </SelectContent>
    </Select>
  );
}
