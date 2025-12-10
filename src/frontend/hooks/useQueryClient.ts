import { QueryClient } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Hook to create and manage a QueryClient instance.
 * Uses lazy initialization to ensure the client is only created once.
 */
export function useQueryClient() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return queryClient;
}
