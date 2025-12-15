"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";

import { ConfigureSelect } from "@/components/common/ConfigureSelect";
import { Button } from "@/components/ui/button";
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
    <ConfigureSelect title="Chart Visibility & Order">
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
    </ConfigureSelect>
  );
}
