"use client";

import { useEffect, useState } from "react";

import { ConfigureSelect } from "@/components/common/ConfigureSelect";
import { Button } from "@/components/ui/button";

import { useBuilder } from "../../hooks/BuilderContext";
import { DurationInput } from "./DurationInput";

export function SimulationMetaMenu() {
  const { blueprint, updateSimParams } = useBuilder();
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const blueprintDuration = blueprint?.simParams?.duration;
    // Default to 1 hour (3600 seconds) if no duration is set
    setDuration(
      blueprintDuration === null || blueprintDuration === undefined
        ? 3600
        : blueprintDuration,
    );
    setError(undefined);
  }, [blueprint]);

  const handleDurationChange = (newDuration: number | null) => {
    setDuration(newDuration);
    // Clear error when user changes duration
    if (error) {
      setError(undefined);
    }
  };

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();

    if (duration !== null && duration <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    updateSimParams({
      duration: duration,
    });
    setOpen(false);
  };

  return (
    <ConfigureSelect
      title="Simulation Duration"
      open={open}
      onOpenChange={setOpen}
    >
      <form onSubmit={handleApply} className="space-y-3">
        <DurationInput value={duration} onChange={handleDurationChange} error={error} />

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
    </ConfigureSelect>
  );
}
