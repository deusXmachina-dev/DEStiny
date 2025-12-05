"use client"

import { formatTime } from "@lib/utils"
import { Area, CartesianGrid, AreaChart, Line, XAxis, YAxis } from "recharts"
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

import { Metric } from "../../types"
import { transformMetricData } from "../../utils"
import { useMemo } from "react"

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--primary)",
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
    let data = chartData.filter(point => point.timestamp <= currentTime);
    if (data.length === 0) {
      data = [chartData[0]];
    }
    return data;
  }, [chartData, currentTime]);

  // Get the current value at the playback time
  const currentValue = useMemo(() => {
    if (visibleData.length === 0) return null;
    return visibleData[visibleData.length - 1].value;
  }, [visibleData]);

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
          {currentValue !== null && (
            <Badge
              variant="outline"
              className="text-xl font-bold tabular-nums bg-accent"
            >
              {Number.isInteger(currentValue) ? currentValue : currentValue.toFixed(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
