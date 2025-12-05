"use client";

import { usePlayback } from "@features/playback";
import { ChartLineStep } from "./charts/LineChart";


export function MetricsPanel() {
    const { recording, hasRecording } = usePlayback();

    // Get metrics from the recording
    const metrics = recording?.metrics || [];

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 border-l border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Metrics</h2>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!hasRecording ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No recording loaded
                    </div>
                ) : metrics.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No metrics available in this recording
                    </div>
                ) : (
                    metrics.map((metric, index) => (
                        <ChartLineStep key={`${metric.name}-${index}`} metric={metric} />
                    ))
                )}
            </div>
        </div>
    );
}

