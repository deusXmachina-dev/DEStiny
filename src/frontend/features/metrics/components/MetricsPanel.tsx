"use client";

import { usePlayback } from "@features/playback";
import { useTimePolling } from "@features/playback/hooks/useTimePolling";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";

import { MetricsProvider, useMetrics } from "../hooks";
import type { StateMetric, TimeSeriesMetric } from "../index";
import { AreaChartWithSteps } from "./charts/AreaChartWithSteps";
import { HistogramChart } from "./charts/HistogramChart";
import { StateProportionChart } from "./charts/StateProportionChart";
import { MetricsSelector } from "./MetricsSelector";

function MetricsPanelContent() {
  const { hasRecording, duration } = usePlayback();
  const currentTime = useTimePolling(1000);
  
  const {
    displayedMetrics,
    visibleMetrics,
    metricOrder,
    handleToggleVisibility,
    handleMoveUp,
    handleMoveDown,
  } = useMetrics();

  console.log("MetricsPanelContent rerender");

  return (
    <SidePanel>
      <SidePanel.Header className="justify-end p-3 border-b-0">
        {hasRecording && metricOrder.length > 0 && (
          <MetricsSelector
            visibleMetrics={visibleMetrics}
            metricOrder={metricOrder}
            onToggleVisibility={handleToggleVisibility}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        )}
      </SidePanel.Header>

      <SidePanel.Content className="space-y-4 pt-0">
        {!hasRecording ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No recording loaded
          </div>
        ) : metricOrder.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No metrics available in this recording
          </div>
        ) : (
          <>
            {displayedMetrics.map((metric, index) => {
              if (metric.type === "sample") {
                return (
                  <HistogramChart
                    key={`${metric.name}-${index}`}
                    metric={metric as TimeSeriesMetric}
                    currentTime={currentTime}
                    maxDuration={duration}
                  />
                );
              }
              if (metric.type === "state") {
                return (
                  <StateProportionChart
                    key={`${metric.name}-${index}`}
                    metric={metric as StateMetric}
                    currentTime={currentTime}
                  />
                );
              }
              // counter or gauge
              return (
                <AreaChartWithSteps
                  key={`${metric.name}-${index}`}
                  metric={metric as TimeSeriesMetric}
                  currentTime={currentTime}
                  maxDuration={duration}
                />
              );
            })}
          </>
        )}
      </SidePanel.Content>
    </SidePanel>
  );
}

export function MetricsPanel() {
  return (
    <ClientOnly>
      <MetricsProvider>
        <MetricsPanelContent />
      </MetricsProvider>
    </ClientOnly>
  );
}
