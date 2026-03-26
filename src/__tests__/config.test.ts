import { describe, expect, it } from "vitest";
import {
  isHostAllowed,
  isOriginAllowed,
  readHttpServerConfig,
  requireCarbonCopyApiKey,
  requireHttpBearerToken,
} from "../config.js";

describe("config", () => {
  it("requires CARBONCOPY_API_KEY", () => {
    expect(() => requireCarbonCopyApiKey({})).toThrow(
      /CARBONCOPY_API_KEY environment variable is required/,
    );
  });

  it("returns CARBONCOPY_API_KEY when present", () => {
    expect(requireCarbonCopyApiKey({ CARBONCOPY_API_KEY: "cc_abc" })).toBe(
      "cc_abc",
    );
  });

  it("requires MCP_HTTP_BEARER_TOKEN for HTTP mode", () => {
    expect(() => requireHttpBearerToken({})).toThrow(
      /MCP_HTTP_BEARER_TOKEN environment variable is required/,
    );
  });

  it("parses HTTP config defaults securely", () => {
    expect(
      readHttpServerConfig({
        MCP_HTTP_BEARER_TOKEN: "secret-token",
      }),
    ).toEqual({
      host: "127.0.0.1",
      port: 3000,
      endpoint: "/mcp",
      allowedOrigins: [],
      allowedHosts: ["127.0.0.1", "localhost"],
      authToken: "secret-token",
      maxBodyBytes: 1024 * 1024,
    });
  });

  it("parses HTTP config from env vars", () => {
    expect(
      readHttpServerConfig({
        MCP_HTTP_HOST: "0.0.0.0",
        MCP_HTTP_PORT: "8080",
        MCP_HTTP_ENDPOINT: "api/mcp",
        MCP_HTTP_ALLOWED_ORIGINS: "https://a.example, https://b.example",
        MCP_HTTP_ALLOWED_HOSTS: "api.example.com, [::1]",
        MCP_HTTP_BEARER_TOKEN: "token-123",
        MCP_HTTP_MAX_BODY_BYTES: "2048",
      }),
    ).toEqual({
      host: "0.0.0.0",
      port: 8080,
      endpoint: "/api/mcp",
      allowedOrigins: ["https://a.example", "https://b.example"],
      allowedHosts: ["api.example.com", "[::1]"],
      authToken: "token-123",
      maxBodyBytes: 2048,
    });
  });

  it("rejects invalid numeric HTTP settings", () => {
    expect(() =>
      readHttpServerConfig({
        MCP_HTTP_PORT: "99999",
        MCP_HTTP_BEARER_TOKEN: "token",
      }),
    ).toThrow(/Invalid MCP_HTTP_PORT/);

    expect(() =>
      readHttpServerConfig({
        MCP_HTTP_MAX_BODY_BYTES: "0",
        MCP_HTTP_BEARER_TOKEN: "token",
      }),
    ).toThrow(/Invalid MCP_HTTP_MAX_BODY_BYTES/);
  });

  it("matches host/origin allow-lists", () => {
    expect(isOriginAllowed("https://a.example", [])).toBe(false);
    expect(isOriginAllowed("https://a.example", ["https://a.example"])).toBe(
      true,
    );
    expect(isOriginAllowed("https://a.example", ["*"])).toBe(true);
    expect(isOriginAllowed("https://b.example", ["https://a.example"])).toBe(
      false,
    );

    expect(isHostAllowed("API.EXAMPLE.COM", ["api.example.com"])).toBe(true);
    expect(isHostAllowed("other.example.com", ["api.example.com"])).toBe(
      false,
    );
  });
});
