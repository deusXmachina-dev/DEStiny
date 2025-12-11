"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { useMetricData } from "../../hooks";
import type { Metric } from "../../index";
import { ChartLayout } from "./ChartLayout";

const chartConfig = {
  count: {
    label: "Count",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface HistogramChartProps {
  metric: Metric;
  maxDuration?: number;
  currentTime?: number;
}

export function HistogramChart({
  metric,
  maxDuration = 600,
  currentTime = maxDuration,
}: HistogramChartProps) {
  // Transform data and calculate visible data
  const { chartData, visibleData } = useMetricData({ metric, currentTime });

  // Calculate histogram bins from visible data
  const histogramData = useMemo(() => {
    if (!visibleData || visibleData.length === 0) {
      return [];
    }

    // Extract values from visible data
    const values = visibleData.map((d) => d.value);

    // Calculate min and max
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Edge case: all values are the same
    if (min === max) {
      return [
        {
          label: min.toFixed(1),
          count: values.length,
          binMin: min,
          binMax: min,
        },
      ];
    }

    // Calculate number of bins (using Sturges' formula or default to 15)
    const binCount = Math.min(
      Math.max(Math.ceil(Math.log2(values.length) + 1), 10),
      20,
    );

    // Calculate bin width
    const binWidth = (max - min) / binCount;

    // Create bins
    const bins: Array<{
      label: string;
      count: number;
      binMin: number;
      binMax: number;
    }> = [];

    for (let i = 0; i < binCount; i++) {
      const binMin = min + i * binWidth;
      const binMax = i === binCount - 1 ? max : min + (i + 1) * binWidth;

      bins.push({
        label: `${binMin.toFixed(1)}-${binMax.toFixed(1)}`,
        count: 0,
        binMin,
        binMax,
      });
    }

    // Count values in each bin
    values.forEach((value) => {
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
        if (!bin) {
          continue;
        }
        // Last bin includes the max value
        if (i === bins.length - 1) {
          if (value >= bin.binMin && value <= bin.binMax) {
            bin.count++;
            break;
          }
        } else {
          if (value >= bin.binMin && value < bin.binMax) {
            bin.count++;
            break;
          }
        }
      }
    });

    return bins;
  }, [visibleData]);

  // Calculate total count for badge
  const totalCount = useMemo(
    () => histogramData.reduce((sum, bin) => sum + bin.count, 0),
    [histogramData],
  );

  return (
    <ChartLayout
      title={metric.name}
      badge={totalCount > 0 ? totalCount : null}
      isEmpty={!chartData || chartData.length === 0}
    >
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={histogramData}
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
            dataKey="label"
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
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
                nameKey="count"
                labelKey="label"
                labelFormatter={(_value, payload) => {
                  const label = payload?.[0]?.payload?.label;
                  if (label !== undefined) {
                    return `Range: ${label}`;
                  }
                  return null;
                }}
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </ChartLayout>
  );
}
