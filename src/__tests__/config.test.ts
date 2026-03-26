import { describe, expect, it } from "vitest";
import {
  isHostAllowed,
  isOriginAllowed,
  readHttpServerConfig,
  requireCarbonCopyApiKey,
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

  it("parses HTTP config defaults", () => {
    expect(readHttpServerConfig({})).toEqual({
      host: "0.0.0.0",
      port: 3000,
      endpoint: "/mcp",
      allowedOrigins: [],
      allowedHosts: [],
    });
  });

  it("parses HTTP config from env vars", () => {
    expect(
      readHttpServerConfig({
        MCP_HTTP_HOST: "127.0.0.1",
        MCP_HTTP_PORT: "8080",
        MCP_HTTP_ENDPOINT: "api/mcp",
        MCP_HTTP_ALLOWED_ORIGINS: "https://a.example, https://b.example",
        MCP_HTTP_ALLOWED_HOSTS: "api.example.com, [::1]",
      }),
    ).toEqual({
      host: "127.0.0.1",
      port: 8080,
      endpoint: "/api/mcp",
      allowedOrigins: ["https://a.example", "https://b.example"],
      allowedHosts: ["api.example.com", "[::1]"],
    });
  });

  it("rejects invalid HTTP port", () => {
    expect(() => readHttpServerConfig({ MCP_HTTP_PORT: "99999" })).toThrow(
      /Invalid MCP_HTTP_PORT/,
    );
  });

  it("matches host/origin allow-lists", () => {
    expect(isOriginAllowed("https://a.example", [])).toBe(true);
    expect(isOriginAllowed("https://a.example", ["https://a.example"])).toBe(
      true,
    );
    expect(isOriginAllowed("https://b.example", ["https://a.example"])).toBe(
      false,
    );

    expect(isHostAllowed("API.EXAMPLE.COM", ["api.example.com"])).toBe(true);
    expect(isHostAllowed("other.example.com", ["api.example.com"])).toBe(
      false,
    );
  });
});
