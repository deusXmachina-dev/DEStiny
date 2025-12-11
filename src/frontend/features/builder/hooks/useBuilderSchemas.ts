"use client";

import { useEffect, useState } from "react";

import { $api, client } from "@/lib/api-client";

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

  const { data: schemas = [], isLoading, error } = $api.useQuery("get", "/api/schema");

  return { schemas, isLoading, error };
};
