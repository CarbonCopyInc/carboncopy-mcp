export type HttpServerConfig = {
  host: string;
  port: number;
  endpoint: string;
  allowedOrigins: string[];
  allowedHosts: string[];
};

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function normalizeEndpoint(value: string | undefined): string {
  const raw = value?.trim() || "/mcp";
  if (!raw.startsWith("/")) return `/${raw}`;
  return raw;
}

function parsePort(value: string | undefined): number {
  if (!value) return 3000;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(
      `Invalid MCP_HTTP_PORT: ${value}. Expected an integer between 1 and 65535.`,
    );
  }

  return parsed;
}

export function requireCarbonCopyApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const apiKey = env.CARBONCOPY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "CARBONCOPY_API_KEY environment variable is required. Set it to your Carbon Copy API key (format: cc_<64 hex chars>).",
    );
  }

  return apiKey;
}

export function readHttpServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): HttpServerConfig {
  return {
    host: env.MCP_HTTP_HOST?.trim() || "0.0.0.0",
    port: parsePort(env.MCP_HTTP_PORT),
    endpoint: normalizeEndpoint(env.MCP_HTTP_ENDPOINT),
    allowedOrigins: parseCsv(env.MCP_HTTP_ALLOWED_ORIGINS),
    allowedHosts: parseCsv(env.MCP_HTTP_ALLOWED_HOSTS).map((host) =>
      host.toLowerCase(),
    ),
  };
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) return true;
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
}

export function isHostAllowed(host: string, allowedHosts: string[]): boolean {
  if (allowedHosts.length === 0) return true;
  return allowedHosts.includes(host.toLowerCase());
}
