"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

interface MetricsSelectorProps {
  visibleMetrics: Set<string>;
  metricOrder: string[];
  onToggleVisibility: (metricName: string) => void;
  onMoveUp: (metricName: string) => void;
  onMoveDown: (metricName: string) => void;
}

export function MetricsSelector({
  visibleMetrics,
  metricOrder,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
}: MetricsSelectorProps) {
  return (
    <Select>
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
            Chart Visibility & Order
          </div>
          <div className="space-y-1">
            {metricOrder.map((metricName, index) => {
              const isVisible = visibleMetrics.has(metricName);
              const isFirst = index === 0;
              const isLast = index === metricOrder.length - 1;

              return (
                <div
                  key={metricName}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 group"
                >
                  {/* Visibility Toggle */}
                  <Toggle
                    pressed={isVisible}
                    onPressedChange={() => onToggleVisibility(metricName)}
                    size="sm"
                    variant="outline"
                    aria-label={`Toggle visibility for ${metricName}`}
                  >
                    {isVisible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </Toggle>

                  {/* Metric Name */}
                  <span className="flex-1 text-sm truncate">{metricName}</span>

                  {/* Reorder Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onMoveUp(metricName)}
                      disabled={isFirst}
                      aria-label={`Move ${metricName} up`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onMoveDown(metricName)}
                      disabled={isLast}
                      aria-label={`Move ${metricName} down`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SelectContent>
    </Select>
  );
}
