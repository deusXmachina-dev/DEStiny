"use client";

import { useEffect, useState } from "react";

import { client } from "@/lib/api-client";

import type { BuilderEntitySchema } from "../types";

/**
 * Hook to fetch builder entity schemas from the backend API.
 * Uses the typed API client for type-safe requests.
 *
 * Returns:
 * - schemas: Array of available entity schemas (mapped to local BuilderEntitySchema type)
 * - isLoading: Whether the schemas are currently being fetched
 * - error: Any error that occurred during fetching
 */
export const useBuilderSchemas = () => {
  const [schemas, setSchemas] = useState<BuilderEntitySchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await client.GET("/api/schema");

        if (fetchError) {
          throw new Error(`Failed to fetch schemas: ${String(fetchError)}`);
        }

        if (!data) {
          throw new Error("No data returned from schema endpoint");
        }

        // The OpenAPI schema returns BuilderEntitySchema[] which is compatible
        // with our local BuilderEntitySchema type (extends the OpenAPI type)
        setSchemas(data as BuilderEntitySchema[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        console.error("Failed to fetch builder schemas:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchemas();
  }, []);

  return { schemas, isLoading, error };
};
