"use client";

import { usePlayback } from "@features/playback";

import { MetricsProvider, useMetrics } from "../hooks";

import { AreaChartWithSteps } from "./charts/AreaChartWithSteps";
import { MetricsSelector } from "./MetricsSelector";
import { ClientOnly } from "@/components/common/ClientOnly";

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
    <div className="w-full h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Metrics</h2>
        {hasRecording && metricOrder.length > 0 && (
          <MetricsSelector
            visibleMetrics={visibleMetrics}
            metricOrder={metricOrder}
            onToggleVisibility={handleToggleVisibility}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        )}
      </div>
            
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasRecording ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No recording loaded
          </div>
        ) : metricOrder.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No metrics available in this recording
          </div>
        ) : (
          displayedMetrics.map((metric, index) => (
            <AreaChartWithSteps
              key={`${metric.name}-${index}`}
              metric={metric}
              currentTime={currentTime}
              maxDuration={duration}
            />
          ))
        )}
      </div>
    </div>
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
