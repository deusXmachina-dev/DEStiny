"use client"

import { formatTime } from "@lib/utils"
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, LineChart, XAxis, YAxis } from "recharts"

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

import { Metric } from "../../types"
import { transformMetricData } from "../../utils"
import { useMemo } from "react"

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface ChartLineStepProps {
  metric: Metric;
  currentTime?: number;
  maxDuration?: number;
}

export function ChartLineStep({ metric, currentTime = 300, maxDuration = 600 }: ChartLineStepProps) {
  // Transform data from parallel arrays to Recharts format
  const chartData = useMemo(() => transformMetricData(metric), [metric]);
  
  const visibleData = useMemo(() => {
    return chartData.filter(point => point.timestamp <= currentTime);
  }, [chartData, currentTime]);

  // Calculate Y-axis domain from all data to keep scale consistent
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 1];
    const values = chartData.map(d => d.value);
    const max = Math.max(...values);
    // Round up to nearest nice number for better tick spacing
    const niceMax = Math.ceil(max * 1.1); // Add 10% padding
    return [0, niceMax];
  }, [chartData]);

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
        <CardTitle>{metric.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ComposedChart
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
              tickSize={10}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              allowDecimals={false}
            />
{/*             <ChartTooltip
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
            /> */}
            <Line
              dataKey="value"
              type="step"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              data={visibleData}
              dataKey="value"
              type="step"
              stroke="var(--color-value)"
              strokeWidth={2}
              isAnimationActive={false}
              fill="var(--color-value)"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
