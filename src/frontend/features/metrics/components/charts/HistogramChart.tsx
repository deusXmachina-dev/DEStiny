"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useMemo } from "react"

import { Metric } from "../../types"
import { transformMetricData } from "../../utils"

const chartConfig = {
  count: {
    label: "Count",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface HistogramChartProps {
  metric: Metric;
  maxDuration?: number;
  currentTime?: number;
}

export function HistogramChart({ metric, maxDuration = 600, currentTime = maxDuration }: HistogramChartProps) {
  // Transform data from parallel arrays to Recharts format
  const chartData = useMemo(() => transformMetricData(metric), [metric]);
  
  const visibleData = useMemo(() => {
    let data = chartData.filter(point => point.timestamp <= currentTime);
    if (data.length === 0) {
      data = [chartData[0]];
    }
    return data;
  }, [chartData, currentTime]);

  // Calculate histogram bins from visible data
  const histogramData = useMemo(() => {
    if (!visibleData || visibleData.length === 0) {
      return [];
    }

    // Extract values from visible data
    const values = visibleData.map(d => d.value);
    
    // Calculate min and max
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Edge case: all values are the same
    if (min === max) {
      return [{
        label: min.toFixed(1),
        count: values.length,
        binMin: min,
        binMax: min,
      }];
    }

    // Calculate number of bins (using Sturges' formula or default to 15)
    const binCount = Math.min(Math.max(Math.ceil(Math.log2(values.length) + 1), 10), 20);
    
    // Calculate bin width
    const binWidth = (max - min) / binCount;
    
    // Create bins
    const bins: Array<{ label: string; count: number; binMin: number; binMax: number }> = [];
    
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
    values.forEach(value => {
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
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
  const totalCount = useMemo(() => {
    return histogramData.reduce((sum, bin) => sum + bin.count, 0);
  }, [histogramData]);

  // Handle empty data
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{metric.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{metric.name}</CardTitle>
          {totalCount > 0 && (
            <Badge
              variant="outline"
              className="text-xl font-bold tabular-nums bg-accent"
            >
              {totalCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
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
                  labelFormatter={(value) => `Range: ${value}`}
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
      </CardContent>
    </Card>
  )
}
