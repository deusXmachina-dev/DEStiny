"use client";

import { usePlayback } from "@features/playback";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";

import { MetricsProvider, useMetrics } from "../hooks";
import { AreaChartWithSteps } from "./charts/AreaChartWithSteps";
import { HistogramChart } from "./charts/HistogramChart";
import { MetricsSelector } from "./MetricsSelector";

function MetricsPanelContent() {
  const { hasRecording, currentTime, duration } = usePlayback();
  const {
    displayedMetrics,
    visibleMetrics,
    metricOrder,
    handleToggleVisibility,
    handleMoveUp,
    handleMoveDown,
  } = useMetrics();

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

      <SidePanel.Content className="space-y-4 py-0">
        {!hasRecording ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No recording loaded
          </div>
        ) : metricOrder.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No metrics available in this recording
          </div>
        ) : (
          displayedMetrics.map((metric, index) =>
            metric.type === "sample" ? (
              <HistogramChart
                key={`${metric.name}-${index}`}
                metric={metric}
                currentTime={currentTime}
                maxDuration={duration}
              />
            ) : (
              <AreaChartWithSteps
                key={`${metric.name}-${index}`}
                metric={metric}
                currentTime={currentTime}
                maxDuration={duration}
              />
            )
          )
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
