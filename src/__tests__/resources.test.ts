import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarbonCopyClient } from "../client.js";
import { registerPortfolioResources } from "../resources/portfolio.js";
import { registerTraderResources } from "../resources/traders.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RegisteredResource = {
  name: string;
  title?: string;
  metadata?: {
    title?: string;
    description?: string;
    mimeType?: string;
  };
  readCallback: (uri: URL, extra: unknown) => Promise<unknown>;
  enabled: boolean;
};

type ServerInternals = {
  _registeredResources: Record<string, RegisteredResource>;
};

function getResources(server: McpServer) {
  return (server as unknown as ServerInternals)._registeredResources;
}

function createMockFetchResponse(body: unknown = {}) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: () => null },
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    clone: vi.fn().mockReturnValue({ json: vi.fn().mockResolvedValue(body) }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Resource Registration", () => {
  let server: McpServer;
  let client: CarbonCopyClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    server = new McpServer({ name: "test", version: "0.0.1" });
    client = new CarbonCopyClient("cc_test");

    registerPortfolioResources(server, client);
    registerTraderResources(server, client);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Registration checks
  // -------------------------------------------------------------------------

  it("registers exactly 2 resources", () => {
    const resources = getResources(server);
    expect(Object.keys(resources)).toHaveLength(2);
  });

  it("registers the portfolio resource at carboncopy://portfolio", () => {
    const resources = getResources(server);
    expect(resources).toHaveProperty("carboncopy://portfolio");
  });

  it("registers the traders resource at carboncopy://traders", () => {
    const resources = getResources(server);
    expect(resources).toHaveProperty("carboncopy://traders");
  });

  it("portfolio resource has name 'portfolio'", () => {
    const resources = getResources(server);
    expect(resources["carboncopy://portfolio"].name).toBe("portfolio");
  });

  it("traders resource has name 'traders'", () => {
    const resources = getResources(server);
    expect(resources["carboncopy://traders"].name).toBe("traders");
  });

  it("portfolio resource has mimeType application/json", () => {
    const resources = getResources(server);
    const resource = resources["carboncopy://portfolio"];
    expect(resource.metadata?.mimeType).toBe("application/json");
  });

  it("traders resource has mimeType application/json", () => {
    const resources = getResources(server);
    const resource = resources["carboncopy://traders"];
    expect(resource.metadata?.mimeType).toBe("application/json");
  });

  it("all resources are enabled by default", () => {
    const resources = getResources(server);
    for (const resource of Object.values(resources)) {
      expect(resource.enabled).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // Portfolio resource — readCallback
  // -------------------------------------------------------------------------

  describe("portfolio resource — read", () => {
    it("returns a content block with URI carboncopy://portfolio", async () => {
      const portfolioData = { totalValue: 1234.56, pnl: 123.45 };
      fetchMock.mockResolvedValue(createMockFetchResponse(portfolioData));

      const resource = getResources(server)["carboncopy://portfolio"];
      const uri = new URL("carboncopy://portfolio");
      const result = (await resource.readCallback(uri, {})) as {
        contents: { uri: string; mimeType: string; text: string }[];
      };

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe("carboncopy://portfolio");
    });

    it("returns application/json mimeType in content", async () => {
      fetchMock.mockResolvedValue(createMockFetchResponse({ v: 1 }));

      const resource = getResources(server)["carboncopy://portfolio"];
      const result = (await resource.readCallback(
        new URL("carboncopy://portfolio"),
        {},
      )) as { contents: { uri: string; mimeType: string; text: string }[] };

      expect(result.contents[0].mimeType).toBe("application/json");
    });

    it("returns JSON-stringified portfolio data as text", async () => {
      const portfolioData = { totalValue: 500, positions: [] };
      fetchMock.mockResolvedValue(createMockFetchResponse(portfolioData));

      const resource = getResources(server)["carboncopy://portfolio"];
      const result = (await resource.readCallback(
        new URL("carboncopy://portfolio"),
        {},
      )) as { contents: { uri: string; mimeType: string; text: string }[] };

      expect(JSON.parse(result.contents[0].text)).toEqual(portfolioData);
    });

    it("calls GET /api/v1/portfolio when portfolio resource is read", async () => {
      fetchMock.mockResolvedValue(createMockFetchResponse({}));

      const resource = getResources(server)["carboncopy://portfolio"];
      await resource.readCallback(new URL("carboncopy://portfolio"), {});

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio");
      expect(init.method).toBe("GET");
    });

    it("propagates API errors from the portfolio resource read", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: { get: () => null },
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue({ message: "unauthorized" }),
        }),
      });

      const resource = getResources(server)["carboncopy://portfolio"];
      await expect(
        resource.readCallback(new URL("carboncopy://portfolio"), {}),
      ).rejects.toThrow(/Carbon Copy API error 401/);
    });
  });

  // -------------------------------------------------------------------------
  // Traders resource — readCallback
  // -------------------------------------------------------------------------

  describe("traders resource — read", () => {
    it("returns a content block with URI carboncopy://traders", async () => {
      const tradersData = [{ wallet: "0xabc", copyPercentage: 50 }];
      fetchMock.mockResolvedValue(createMockFetchResponse(tradersData));

      const resource = getResources(server)["carboncopy://traders"];
      const result = (await resource.readCallback(
        new URL("carboncopy://traders"),
        {},
      )) as { contents: { uri: string; mimeType: string; text: string }[] };

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe("carboncopy://traders");
    });

    it("returns application/json mimeType in content", async () => {
      fetchMock.mockResolvedValue(createMockFetchResponse([]));

      const resource = getResources(server)["carboncopy://traders"];
      const result = (await resource.readCallback(
        new URL("carboncopy://traders"),
        {},
      )) as { contents: { uri: string; mimeType: string; text: string }[] };

      expect(result.contents[0].mimeType).toBe("application/json");
    });

    it("returns JSON-stringified traders list as text", async () => {
      const tradersData = [
        { wallet: "0xabc", copyPercentage: 50 },
        { wallet: "0xdef", copyPercentage: 25 },
      ];
      fetchMock.mockResolvedValue(createMockFetchResponse(tradersData));

      const resource = getResources(server)["carboncopy://traders"];
      const result = (await resource.readCallback(
        new URL("carboncopy://traders"),
        {},
      )) as { contents: { uri: string; mimeType: string; text: string }[] };

      expect(JSON.parse(result.contents[0].text)).toEqual(tradersData);
    });

    it("calls GET /api/v1/portfolio/traders when traders resource is read", async () => {
      fetchMock.mockResolvedValue(createMockFetchResponse([]));

      const resource = getResources(server)["carboncopy://traders"];
      await resource.readCallback(new URL("carboncopy://traders"), {});

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio/traders");
      expect(init.method).toBe("GET");
    });

    it("propagates API errors from the traders resource read", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: { get: () => null },
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue({ message: "forbidden" }),
        }),
      });

      const resource = getResources(server)["carboncopy://traders"];
      await expect(
        resource.readCallback(new URL("carboncopy://traders"), {}),
      ).rejects.toThrow(/Carbon Copy API error 403/);
    });
  });
});
