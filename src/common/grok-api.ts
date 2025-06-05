import { getUserAgent } from "universal-user-agent";
import { createGrokError } from "./grok-errors";
import { VERSION } from "./version";

// Retrieve API key from environment variable
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_BASE_URL =
  process.env.GROK_API_BASE_URL || "https://api.x.ai/v1";

// Types for API requests
export type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

// Parse response body based on content type
async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  } else {
    return response.text();
  }
}

// Build URL with parameters
export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | undefined>
): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  }

  return url.toString();
}

// Set up user agent for API calls
const USER_AGENT = `grok-mcp/v${VERSION} ${getUserAgent()}`;

// Main API request function
export async function grokRequest(
  endpoint: string,
  options: RequestOptions = {}
): Promise<unknown> {
  if (!GROK_API_KEY) {
    throw new Error("GROK_API_KEY environment variable is not set");
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${GROK_API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Authorization: `Bearer ${GROK_API_KEY}`,
    "Content-Type": "application/json",
    "Accept-Language": "en-US",
    ...(options.headers || {}),
  };

  const method = options.method || "GET";

  const requestInit: RequestInit = {
    method,
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const response = await fetch(url, requestInit);
    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw createGrokError(response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      throw error;
    }

    throw new Error(
      `Failed to make request to ${endpoint}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
