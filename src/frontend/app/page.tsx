"use client";

import { PlaybackProvider, PlaybackControls, usePlayback } from "@features/playback";
import { SimulationApp } from "@features/simulation";
import { MetricsPanel } from "@features/metrics";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

function HomeContent() {
  const { hasRecording } = usePlayback();

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Main Content: Resizable Panels */}
      <div className="flex-1 min-h-0 w-full">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Simulation */}
          <ResizablePanel defaultSize={75} minSize={50}>
            <SimulationApp />
          </ResizablePanel>
          
          {/* Resize Handle */}
          <ResizableHandle withHandle />
          
          {/* Right Panel: Metrics */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <MetricsPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Bottom Navigation Bar */}
      <div className="bg-gray-100 border-t border-gray-300 shadow-lg">
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
