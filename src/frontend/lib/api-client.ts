import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "@/types/api";
import { BACKEND_URL } from "@/config/api";

const client = createFetchClient<paths>({
  baseUrl: BACKEND_URL,
  credentials: "include",
});

const $api = createClient(client);

export { client, $api };
