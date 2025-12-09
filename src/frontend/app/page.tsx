"use client";

import { BuilderPanel, BuilderProvider, BuilderViewport } from "@features/builder";
import { MetricsPanel } from "@features/metrics";
import { PlaybackControls, PlaybackProvider, usePlayback } from "@features/playback";
import { SimulationApp } from "@features/simulation";
import { EditorPanel } from "@features/editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function HomeContent() {
  const { hasRecording } = usePlayback();
  const { mode } = useAppState();

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Main Content: Fixed Split Panels */}
      <div className="flex-1 min-h-0 w-full flex">
        {/* Left Panel: Simulation (70%) */}
        <div className="w-[70%] h-full">
          {mode === "simulation" ? <SimulationViewport /> : <BuilderViewport />}
        </div>
          
        {/* Right Panel: Metrics/Editor (30%) */}
        <div className="w-[30%] h-full border-l flex flex-col">
          <Tabs defaultValue="metrics" className="flex flex-col h-full gap-0">
            <div className="border-l border-b border-border p-4 flex justify-center">
              <TabsList className="h-10 p-[6px]">
                <TabsTrigger value="metrics" className="text-md p-4 font-mono">
                  Metrics
                </TabsTrigger>
                <TabsTrigger value="editor" className="text-md p-4 font-mono">
                  Editor
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="metrics" className="flex-1 min-h-0 mt-0">
              <MetricsPanel />
            </TabsContent>
            <TabsContent value="editor" className="flex-1 min-h-0 mt-0">
              <EditorPanel />
            </TabsContent>
          </Tabs>
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
    <AppStateProvider>
      <BuilderProvider>
        <PlaybackProvider>
          <HomeContent />
        </PlaybackProvider>
      </BuilderProvider>
    </AppStateProvider>
  );
}
