/**
 * Backend API configuration
 */

const PRODUCTION_BACKEND_URL =
  "https://destiny-backend-947027913956.us-east1.run.app";
const DEVELOPMENT_BACKEND_URL = "http://localhost:8000";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === "production"
    ? PRODUCTION_BACKEND_URL
    : DEVELOPMENT_BACKEND_URL);
