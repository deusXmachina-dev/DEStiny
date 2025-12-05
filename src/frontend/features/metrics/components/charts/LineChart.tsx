"use client"

import { formatTime } from "@lib/utils"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

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
  maxDuration?: number;
}

export function ChartLineStep({ metric, maxDuration = 600 }: ChartLineStepProps) {
  // Transform data from parallel arrays to Recharts format
  const chartData = useMemo(() => transformMetricData(metric), [metric]);

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
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
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
            <Line
              dataKey="value"
              type="step"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
