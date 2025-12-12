"use client";

import { formatTime } from "@lib/utils";
import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import type { StateMetric } from "../../index";
import { calculateStateProportions } from "../../utils";
import { ChartLayout } from "./ChartLayout";

interface StateProportionChartProps {
  metric: StateMetric;
  maxDuration?: number;
  currentTime?: number;
}

// Generate chart config with colors for each state
// Using chart color variables for consistency
const generateChartConfig = (states: string[]): ChartConfig => {
  const colorVars = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  const config: ChartConfig = {};
  states.forEach((state, index) => {
    config[state] = {
      label: state,
      color: colorVars[index % colorVars.length],
    };
  });
  return config;
};

export function StateProportionChart({
  metric,
  maxDuration = 600,
  currentTime = maxDuration,
}: StateProportionChartProps) {
  // Calculate state proportions
  const proportions = useMemo(
    () => calculateStateProportions(metric, currentTime, maxDuration),
    [metric, currentTime, maxDuration],
  );

  // Generate chart config for colors
  const chartConfig = useMemo(
    () => generateChartConfig(metric.data.possible_states),
    [metric.data.possible_states],
  );

  // Check if there's any data
  const hasData = proportions.some((p) => p.duration > 0);

  // Get current state (the last state before or at currentTime)
  const currentState = useMemo(() => {
    if (!hasData || metric.data.timestamp.length === 0) {
      return null;
    }
    // Find the last state change before or at currentTime
    for (let i = metric.data.timestamp.length - 1; i >= 0; i--) {
      if (metric.data.timestamp[i] <= currentTime) {
        return metric.data.state[i];
      }
    }
    return metric.data.state[0] || null;
  }, [metric, currentTime, hasData]);

  // Get badge style based on current state color
  const badgeStyle = useMemo(() => {
    if (!currentState) return undefined;
    const color = chartConfig[currentState]?.color;
    if (!color) return undefined;
    return {
      backgroundColor: color,
      color: "white",
      borderColor: color,
    } as React.CSSProperties;
  }, [currentState, chartConfig]);

  // Format data for pie chart (only include states with duration > 0)
  const pieData = useMemo(
    () =>
      proportions
        .filter((p) => p.duration > 0)
        .map((p) => ({
          name: p.state,
          value: p.proportion,
          duration: p.duration,
        })),
    [proportions],
  );

  return (
    <ChartLayout
      title={metric.name}
      badge={currentState}
      badgeStyle={badgeStyle}
      isEmpty={!hasData || pieData.length === 0}
    >
      <ChartContainer config={chartConfig}>
        <PieChart>
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const data = payload[0];
              // For PieChart, the name is set via nameKey="name", so it's on data.name
              // The original pieData entry is in data.payload
              const pieDataEntry = (data.payload || {}) as {
                name?: string;
                duration?: number;
                value?: number;
              };
              const stateName = data.name || pieDataEntry.name || "Unknown";
              const proportion = (data.value as number) || 0;
              const duration = pieDataEntry.duration || 0;
              const percentage = (proportion * 100).toFixed(1);

              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-1.5">
                    <div className="font-medium">State: {stateName}</div>
                    <div className="text-sm text-muted-foreground">
                      {percentage}% ({formatTime(duration)})
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={chartConfig[entry.name]?.color || "var(--chart-1)"}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* Legend */}
      {hasData && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {proportions.map((p) => {
            const color =
              chartConfig[p.state]?.color || "var(--chart-1)";
            const percentage = (p.proportion * 100).toFixed(1);
            return (
              <div
                key={p.state}
                className="flex items-center gap-1.5 text-xs"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">
                  {p.state}: {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ChartLayout>
  );
}
