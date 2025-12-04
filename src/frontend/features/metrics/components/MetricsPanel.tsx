"use client";

import { formatTime,usePlayback } from "@features/playback";

/**
 * MetricsPanel - Placeholder component for metrics visualization.
 * 
 * This component consumes the shared playback context to display
 * metrics synchronized with the simulation playback.
 * 
 * TODO: Replace placeholder with actual charts/graphs
 */
export function MetricsPanel() {
    const { recording, currentTime, duration, isPlaying, speed } = usePlayback();
    
    const hasRecording = recording !== null;

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 border-l border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Metrics</h2>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 overflow-auto">
                {hasRecording ? (
                    <div className="space-y-4">
                        {/* Playback Status */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">Playback Status</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Current Time</p>
                                    <p className="text-xl font-mono font-semibold">{formatTime(currentTime)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p className="text-xl font-mono font-semibold">{formatTime(duration)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className={`text-sm font-medium ${isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
                                        {isPlaying ? 'Playing' : 'Paused'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Speed</p>
                                    <p className="text-sm font-medium">{speed}x</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Placeholder for future charts */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">Charts</h3>
                            <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-400 text-sm">Charts will be displayed here</p>
                            </div>
                        </div>
                        
                        {/* Placeholder for entity metrics */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">Entity Metrics</h3>
                            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-400 text-sm">Entity statistics will appear here</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-500">No recording loaded</p>
                            <p className="text-sm text-gray-400 mt-1">Upload a simulation recording to view metrics</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

