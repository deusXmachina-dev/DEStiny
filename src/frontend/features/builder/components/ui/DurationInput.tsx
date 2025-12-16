"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

interface DurationInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
}

/**
 * Converts seconds to DD:HH:MM:SS format
 */
function secondsToDuration(seconds: number): {
  days: number;
  hours: number;
  minutes: number;
  secs: number;
} {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { days, hours, minutes, secs };
}

/**
 * Converts DD:HH:MM:SS format to seconds
 */
function durationToSeconds(days: number, hours: number, minutes: number, secs: number): number {
  return days * 86400 + hours * 3600 + minutes * 60 + secs;
}

export function DurationInput({ value, onChange, error }: DurationInputProps) {
  const getInitialDuration = () => {
    if (value !== null) {
      const d = secondsToDuration(value);
      return {
        days: String(d.days),
        hours: String(d.hours),
        minutes: String(d.minutes),
        secs: String(d.secs),
      };
    }
    // Show 0:0:0:0 if value is null (auto)
    return {
      days: "0",
      hours: "0",
      minutes: "0",
      secs: "0",
    };
  };

  const initial = getInitialDuration();
  const [days, setDays] = useState(initial.days);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [secs, setSecs] = useState(initial.secs);

  // Update local state when value prop changes
  useEffect(() => {
    if (value !== null) {
      const d = secondsToDuration(value);
      setDays(String(d.days));
      setHours(String(d.hours));
      setMinutes(String(d.minutes));
      setSecs(String(d.secs));
    } else {
      // Show 0:0:0:0 when value is null (auto)
      setDays("0");
      setHours("0");
      setMinutes("0");
      setSecs("0");
    }
  }, [value]);

  const handleBlur = () => {
    // Convert current input values to seconds
    const d = parseInt(days || "0", 10);
    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const s = parseInt(secs || "0", 10);

    const totalSeconds = durationToSeconds(d, h, m, s);

    // Normalize by converting back to DD:HH:MM:SS
    if (totalSeconds === 0) {
      onChange(null);
      setDays("0");
      setHours("0");
      setMinutes("0");
      setSecs("0");
    } else {
      onChange(totalSeconds);
      // The useEffect will update the display values with normalized format
    }
  };

  const handleChange = (field: "days" | "hours" | "minutes" | "secs", newValue: string) => {
    // Only allow numbers or empty string
    if (newValue !== "" && !/^\d+$/.test(newValue)) {
      return;
    }

    // Just update the local state - no conversion yet
    switch (field) {
      case "days":
        setDays(newValue);
        break;
      case "hours":
        setHours(newValue);
        break;
      case "minutes":
        setMinutes(newValue);
        break;
      case "secs":
        setSecs(newValue);
        break;
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when input is focused
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: "days" | "hours" | "minutes" | "secs") => {
    if (e.key === "Tab" && !e.shiftKey) {
      // Tab forward - move to next field
      e.preventDefault();
      const nextField = getNextField(field);
      focusField(nextField);
    } else if (e.key === "Tab" && e.shiftKey) {
      // Shift+Tab - move to previous field
      e.preventDefault();
      const prevField = getPreviousField(field);
      focusField(prevField);
    }
  };

  const getNextField = (field: "days" | "hours" | "minutes" | "secs"): "days" | "hours" | "minutes" | "secs" => {
    switch (field) {
      case "days":
        return "hours";
      case "hours":
        return "minutes";
      case "minutes":
        return "secs";
      case "secs":
        return "days"; // Wrap around
    }
  };

  const getPreviousField = (field: "days" | "hours" | "minutes" | "secs"): "days" | "hours" | "minutes" | "secs" => {
    switch (field) {
      case "days":
        return "secs"; // Wrap around
      case "hours":
        return "days";
      case "minutes":
        return "hours";
      case "secs":
        return "minutes";
    }
  };

  const focusField = (field: "days" | "hours" | "minutes" | "secs") => {
    const fieldId = `duration-${field}`;
    const input = document.getElementById(fieldId) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  };

  const inputClassName = "w-14 h-10 text-center text-sm font-medium";
  const labelClassName = "text-xs font-medium text-muted-foreground mt-1";

  return (
    <div>
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center gap-1.5">
          <Input
            id="duration-days"
            type="text"
            inputMode="numeric"
            value={days}
            onChange={(e) => handleChange("days", e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => handleKeyDown(e, "days")}
            placeholder="00"
            className={inputClassName}
            aria-label="Days"
            tabIndex={1}
          />
          <span className={labelClassName}>Day</span>
        </div>
        <span className="text-muted-foreground text-lg font-medium pt-6">:</span>
        <div className="flex flex-col items-center gap-1.5">
          <Input
            id="duration-hours"
            type="text"
            inputMode="numeric"
            value={hours}
            onChange={(e) => handleChange("hours", e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => handleKeyDown(e, "hours")}
            placeholder="00"
            className={inputClassName}
            aria-label="Hours"
            tabIndex={2}
          />
          <span className={labelClassName}>Hour</span>
        </div>
        <span className="text-muted-foreground text-lg font-medium pt-6">:</span>
        <div className="flex flex-col items-center gap-1.5">
          <Input
            id="duration-minutes"
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => handleChange("minutes", e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => handleKeyDown(e, "minutes")}
            placeholder="00"
            className={inputClassName}
            aria-label="Minutes"
            tabIndex={3}
          />
          <span className={labelClassName}>Minute</span>
        </div>
        <span className="text-muted-foreground text-lg font-medium pt-6">:</span>
        <div className="flex flex-col items-center gap-1.5">
          <Input
            id="duration-secs"
            type="text"
            inputMode="numeric"
            value={secs}
            onChange={(e) => handleChange("secs", e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => handleKeyDown(e, "secs")}
            placeholder="00"
            className={inputClassName}
            aria-label="Seconds"
            tabIndex={4}
          />
          <span className={labelClassName}>Second</span>
        </div>
      </div>
      {error && <p className="text-xs text-destructive mt-2 text-center">{error}</p>}
    </div>
  );
}
