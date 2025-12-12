"use client";

import { formatTime } from "@lib/utils";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { useTimeSeriesMetricData } from "../../hooks";
import type { TimeSeriesMetric } from "../../index";
import { ChartLayout } from "./ChartLayout";

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface AreaChartWithStepsProps {
  metric: TimeSeriesMetric;
  maxDuration?: number;
  currentTime?: number;
}

export function AreaChartWithSteps({
  metric,
  maxDuration = 600,
  currentTime = maxDuration,
}: AreaChartWithStepsProps) {
  // Transform data and calculate visible data
  const { chartData, visibleData } = useTimeSeriesMetricData({
    metric,
    currentTime,
  });

  // Get the current value at the playback time
  const currentValue = useMemo(() => {
    if (visibleData.length === 0) {
      return null;
    }
    return visibleData[visibleData.length - 1]?.value;
  }, [visibleData]);

  // Format badge value
  const badgeValue =
    currentValue !== null
      ? Number.isInteger(currentValue)
        ? currentValue
        : currentValue?.toFixed(1)
      : null;

  return (
    <ChartLayout
      title={metric.name}
      badge={badgeValue}
      isEmpty={!chartData || chartData.length === 0}
    >
      <ChartContainer config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={chartData}
          style={{
            width: "100%",
          }}
          margin={{
            left: 0,
            right: 0,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatTime(value)}
            domain={[0, maxDuration]}
          />
          <YAxis
            type="number"
            width={35}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                nameKey="value"
                labelKey="timestamp"
                labelFormatter={(_value, payload) => {
                  const timestamp = payload?.[0]?.payload?.timestamp;
                  if (timestamp !== undefined) {
                    return `Time: ${formatTime(timestamp)}`;
                  }
                }}
              />
            }
          />
          <Area
            data={visibleData}
            dataKey="value"
            type="step"
            stroke="var(--color-value)"
            strokeWidth={2}
            isAnimationActive={false}
            fill="var(--color-value)"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ChartContainer>
    </ChartLayout>
  );
}
