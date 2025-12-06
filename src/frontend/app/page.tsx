"use client";

import { MetricsPanel } from "@features/metrics";
import { PlaybackControls, PlaybackProvider, usePlayback } from "@features/playback";
import { SimulationApp } from "@features/simulation";

function HomeContent() {
  const { hasRecording } = usePlayback();

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Main Content: Fixed Split Panels */}
      <div className="flex-1 min-h-0 w-full flex">
        {/* Left Panel: Simulation (70%) */}
        <div className="w-[70%] h-full">
          <SimulationApp />
        </div>
          
        {/* Right Panel: Metrics (30%) */}
        <div className="w-[30%] h-full border-l border-border">
          <MetricsPanel />
        </div>
      </div>
      
      {/* Bottom Navigation Bar */}
      <div className="border-t border-border shadow-lg">
        <div className="p-4 max-w-7xl mx-auto">
          <PlaybackControls disabled={!hasRecording} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PlaybackProvider>
      <HomeContent />
    </PlaybackProvider>
  );
}
