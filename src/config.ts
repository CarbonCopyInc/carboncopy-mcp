export type HttpServerConfig = {
  host: string;
  port: number;
  endpoint: string;
  allowedOrigins: string[];
  allowedHosts: string[];
  authToken: string;
  maxBodyBytes: number;
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

function parsePositiveInt(
  value: string | undefined,
  variableName: string,
  fallback: number,
): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid ${variableName}: ${value}. Expected a positive integer.`,
    );
  }

  return parsed;
}

function defaultAllowedHosts(host: string): string[] {
  const normalizedHost = host.toLowerCase();

  if (
    normalizedHost === "0.0.0.0" ||
    normalizedHost === "::" ||
    normalizedHost === "::0"
  ) {
    return ["localhost", "127.0.0.1", "[::1]"];
  }

  if (normalizedHost === "127.0.0.1") {
    return ["127.0.0.1", "localhost"];
  }

  if (normalizedHost === "::1") {
    return ["[::1]", "localhost"];
  }

  return [normalizedHost];
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

export function requireHttpBearerToken(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const token = env.MCP_HTTP_BEARER_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "MCP_HTTP_BEARER_TOKEN environment variable is required for hosted HTTP mode.",
    );
  }

  return token;
}

export function readHttpServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): HttpServerConfig {
  const host = env.MCP_HTTP_HOST?.trim() || "127.0.0.1";
  const configuredAllowedHosts = parseCsv(env.MCP_HTTP_ALLOWED_HOSTS).map((value) =>
    value.toLowerCase(),
  );

  return {
    host,
    port: parsePort(env.MCP_HTTP_PORT),
    endpoint: normalizeEndpoint(env.MCP_HTTP_ENDPOINT),
    allowedOrigins: parseCsv(env.MCP_HTTP_ALLOWED_ORIGINS),
    allowedHosts:
      configuredAllowedHosts.length > 0
        ? configuredAllowedHosts
        : defaultAllowedHosts(host),
    authToken: requireHttpBearerToken(env),
    maxBodyBytes: parsePositiveInt(
      env.MCP_HTTP_MAX_BODY_BYTES,
      "MCP_HTTP_MAX_BODY_BYTES",
      1024 * 1024,
    ),
  };
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
}

export function isHostAllowed(host: string, allowedHosts: string[]): boolean {
  return allowedHosts.includes(host.toLowerCase());
}
