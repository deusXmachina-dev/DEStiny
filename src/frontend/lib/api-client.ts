import createClient from "openapi-fetch";

import { BACKEND_URL } from "@/config/api";
import type { paths } from "@/types/api";

/**
 * Typed API client using openapi-fetch.
 * All API calls are type-safe based on the generated OpenAPI schema.
 */
const client = createClient<paths>({
  baseUrl: BACKEND_URL,
  credentials: "include",
});

export { client };
