"use client";

import { BuilderProvider } from "@features/builder";
import { PlaybackProvider } from "@features/playback";
import { QueryClientProvider } from "@tanstack/react-query";

import { AppStateProvider } from "@/hooks/AppStateContext";
import { ThemeProvider } from "@/hooks/ThemeProvider";
import { useQueryClient } from "@/hooks/useQueryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PlaybackProvider>
          <AppStateProvider>
            <BuilderProvider>{children}</BuilderProvider>
          </AppStateProvider>
        </PlaybackProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
