"use client";

import { formatTime, usePlayback } from "@features/playback";


export function MetricsPanel() {
    const { currentTime, duration, isPlaying, speed, hasRecording } = usePlayback();


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

