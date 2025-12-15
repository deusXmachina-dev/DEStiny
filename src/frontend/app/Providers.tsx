"use client";

import { BuilderProvider } from "@features/builder";
import { PlaybackProvider } from "@features/playback";
import { QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "@/hooks/ThemeProvider";
import { useQueryClient } from "@/hooks/useQueryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PlaybackProvider>
          <BuilderProvider>{children}</BuilderProvider>
        </PlaybackProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
