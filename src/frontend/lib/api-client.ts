import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import { BACKEND_URL } from "@/config/api";
import type { paths } from "@/types/api";

const client = createFetchClient<paths>({
  baseUrl: BACKEND_URL,
  credentials: "include",
});

const $api = createClient(client);

export { $api, client };
