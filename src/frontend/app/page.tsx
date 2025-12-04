"use client";

import { PlaybackProvider, PlaybackControls, usePlayback } from "@features/playback";
import { SimulationApp } from "@features/simulation";

function HomeContent() {
  const { recording } = usePlayback();
  const hasRecording = recording !== null;

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="flex-1 min-h-0 w-full">
        <SimulationApp />
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
