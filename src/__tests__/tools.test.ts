import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarbonCopyClient } from "../client.js";
import { registerAccountTools } from "../tools/account.js";
import { registerOrderTools } from "../tools/orders.js";
import { registerPortfolioTools } from "../tools/portfolio.js";
import { registerTraderTools } from "../tools/traders.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cast McpServer to access private internals for assertions. */
type ServerInternals = {
  _registeredTools: Record<
    string,
    {
      title?: string;
      description?: string;
      annotations?: Record<string, unknown>;
      handler: (...args: unknown[]) => Promise<unknown>;
      enabled: boolean;
    }
  >;
};

function getTools(server: McpServer) {
  return (server as unknown as ServerInternals)._registeredTools;
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
// Setup
// ---------------------------------------------------------------------------

const ALL_TOOL_NAMES = [
  "get_portfolio",
  "get_portfolio_history",
  "get_positions",
  "list_traders",
  "discover_traders",
  "follow_trader",
  "get_trader",
  "get_trader_performance",
  "update_trader",
  "batch_update_traders",
  "unfollow_trader",
  "pause_trader",
  "resume_trader",
  "list_orders",
  "get_order",
  "get_account",
  "health",
] as const;

describe("Tool Registration", () => {
  let server: McpServer;
  let client: CarbonCopyClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    server = new McpServer({ name: "test", version: "0.0.1" });
    client = new CarbonCopyClient("cc_test");

    registerPortfolioTools(server, client);
    registerTraderTools(server, client);
    registerOrderTools(server, client);
    registerAccountTools(server, client);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Count & names
  // -------------------------------------------------------------------------

  it("registers all expected tool names", () => {
    const tools = getTools(server);
    for (const name of ALL_TOOL_NAMES) {
      expect(tools).toHaveProperty(name);
    }
  });

  it("all registered tools are enabled by default", () => {
    const tools = getTools(server);
    for (const tool of Object.values(tools)) {
      expect(tool.enabled).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // Annotations
  // -------------------------------------------------------------------------

  describe("tool annotations", () => {
    it("get_portfolio — readOnlyHint:true, no destructiveHint", () => {
      const { annotations } = getTools(server)["get_portfolio"];
      expect(annotations?.readOnlyHint).toBe(true);
      expect(annotations?.destructiveHint).toBeUndefined();
      expect(annotations?.idempotentHint).toBeUndefined();
    });

    it("get_portfolio_history — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["get_portfolio_history"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("get_positions — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["get_positions"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("list_traders — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["list_traders"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("discover_traders — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["discover_traders"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("follow_trader — readOnlyHint:false, no destructiveHint", () => {
      const { annotations } = getTools(server)["follow_trader"];
      expect(annotations?.readOnlyHint).toBe(false);
      expect(annotations?.destructiveHint).toBeUndefined();
    });

    it("get_trader — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["get_trader"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("get_trader_performance — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["get_trader_performance"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("update_trader — readOnlyHint:false, idempotentHint:true", () => {
      const { annotations } = getTools(server)["update_trader"];
      expect(annotations?.readOnlyHint).toBe(false);
      expect(annotations?.idempotentHint).toBe(true);
    });

    it("batch_update_traders — readOnlyHint:false, idempotentHint:true", () => {
      const { annotations } = getTools(server)["batch_update_traders"];
      expect(annotations?.readOnlyHint).toBe(false);
      expect(annotations?.idempotentHint).toBe(true);
    });

    it("unfollow_trader — readOnlyHint:false, destructiveHint:true", () => {
      const { annotations } = getTools(server)["unfollow_trader"];
      expect(annotations?.readOnlyHint).toBe(false);
      expect(annotations?.destructiveHint).toBe(true);
    });

    it("pause_trader — readOnlyHint:false, idempotentHint:true", () => {
      const { annotations } = getTools(server)["pause_trader"];
      expect(annotations?.readOnlyHint).toBe(false);
      expect(annotations?.idempotentHint).toBe(true);
    });

    it("resume_trader — readOnlyHint:false, idempotentHint:true", () => {
      const { annotations } = getTools(server)["resume_trader"];
      expect(annotations?.readOnlyHint).toBe(false);
      expect(annotations?.idempotentHint).toBe(true);
    });

    it("list_orders — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["list_orders"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("get_order — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["get_order"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("get_account — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["get_account"];
      expect(annotations?.readOnlyHint).toBe(true);
    });

    it("health — readOnlyHint:true", () => {
      const { annotations } = getTools(server)["health"];
      expect(annotations?.readOnlyHint).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Tool execution — verify handlers call client and return content
  // -------------------------------------------------------------------------

  describe("tool execution", () => {
    it("get_portfolio — calls getPortfolio() and returns JSON text", async () => {
      const responseData = { totalValue: 1000, pnl: 50 };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["get_portfolio"];
      const result = (await tool.handler({}, {})) as {
        content: { type: string; text: string }[];
      };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
    });

    it("get_portfolio_history — passes params and returns JSON text", async () => {
      const responseData = { items: [], cursor: null };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["get_portfolio_history"];
      const result = (await tool.handler({ limit: 10, cursor: "abc" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(result.content[0].type).toBe("text");
      expect(JSON.parse(result.content[0].text)).toEqual(responseData);

      // Verify the correct URL was fetched
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/portfolio/history");
      expect(url).toContain("limit=10");
      expect(url).toContain("cursor=abc");
    });

    it("get_positions — calls getPositions() and returns JSON text", async () => {
      const responseData = { positions: [] };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["get_positions"];
      const result = (await tool.handler({}, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/portfolio/positions");
    });

    it("list_traders — calls getTraders() and returns JSON text", async () => {
      const responseData = [{ wallet: "0xabc", copyPercentage: 50 }];
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["list_traders"];
      const result = (await tool.handler({}, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/portfolio/traders");
    });

    it("discover_traders — calls discoverTraders() and returns JSON text", async () => {
      const responseData = [{ walletAddress: "0xabc", roi: 12.5 }];
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["discover_traders"];
      const result = (await tool.handler({ sortBy: "roi" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toMatch(/\/api\/v1\/traders(?:\?|$)/);
      expect(url).toContain("sortBy=roi");
    });

    it("follow_trader — posts follow request and returns JSON text", async () => {
      const responseData = { id: "follow-1", wallet: "0xabc" };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["follow_trader"];
      const args = { wallet: "0xabc", copyPercentage: 50 };
      const result = (await tool.handler(args, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio/traders");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toMatchObject({
        walletAddress: args.wallet,
        copyPercentage: args.copyPercentage,
      });
    });

    it("get_trader — calls getTrader(wallet) and returns JSON text", async () => {
      const responseData = { wallet: "0xabc", copyPercentage: 50 };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["get_trader"];
      const result = (await tool.handler({ wallet: "0xabc" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/portfolio/traders/0xabc");
    });

    it("get_trader_performance — calls performance endpoint and returns JSON text", async () => {
      const responseData = { walletAddress: "0xabc", sharpe: 1.2 };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["get_trader_performance"];
      const result = (await tool.handler({ wallet: "0xabc" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/traders/0xabc/performance");
    });

    it("update_trader — patches trader settings and returns JSON text", async () => {
      const responseData = { wallet: "0xabc", copyPercentage: 75 };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["update_trader"];
      const result = (await tool.handler(
        { wallet: "0xabc", copyPercentage: 75 },
        {},
      )) as { content: { type: string; text: string }[] };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio/traders/0xabc");
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body as string)).toEqual({ copyPercentage: 75 });
    });

    it("batch_update_traders — patches multiple traders", async () => {
      const responseData = { updated: 2, notFound: 0, total: 2 };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["batch_update_traders"];
      const updates = [
        { wallet: "0xabc", copyPercentage: 75 },
        { wallet: "0xdef", copyPercentage: 50 },
      ];
      const result = (await tool.handler({ updates }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio/traders/batch");
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body as string)).toEqual({
        updates: [
          { walletAddress: "0xabc", copyPercentage: 75 },
          { walletAddress: "0xdef", copyPercentage: 50 },
        ],
      });
    });

    it("unfollow_trader — deletes trader and returns JSON text (null body)", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
        statusText: "No Content",
        headers: { get: () => null },
        json: vi.fn(),
        text: vi.fn(),
        clone: vi.fn(),
      });

      const tool = getTools(server)["unfollow_trader"];
      const result = (await tool.handler({ wallet: "0xabc" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(result.content[0].type).toBe("text");
      expect(JSON.parse(result.content[0].text)).toEqual({ success: true });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio/traders/0xabc");
      expect(init.method).toBe("DELETE");
    });

    it("pause_trader — pauses trader and returns JSON text", async () => {
      const responseData = { paused: true };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["pause_trader"];
      const result = (await tool.handler({ wallet: "0xabc" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio/traders/0xabc/pause");
      expect(init.method).toBe("POST");
    });

    it("resume_trader — resumes trader and returns JSON text", async () => {
      const responseData = { paused: false };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["resume_trader"];
      const result = (await tool.handler({ wallet: "0xabc" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/portfolio/traders/0xabc/resume");
      expect(init.method).toBe("POST");
    });

    it("list_orders — calls getOrders() with params and returns JSON text", async () => {
      const responseData = { orders: [], cursor: null };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["list_orders"];
      const result = (await tool.handler({ status: "filled" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/orders");
      expect(url).toContain("status=filled");
    });

    it("get_order — calls getOrder(id) and returns JSON text", async () => {
      const responseData = { id: "id123", status: "filled" };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["get_order"];
      const result = (await tool.handler({ id: "id123" }, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/orders/id123");
    });

    it("get_account — calls getAccount() and returns JSON text", async () => {
      const responseData = { wallet: "0xuser", balance: 500 };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["get_account"];
      const result = (await tool.handler({}, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/account");
    });

    it("health — calls health() and returns JSON text", async () => {
      const responseData = { status: "ok" };
      fetchMock.mockResolvedValue(createMockFetchResponse(responseData));

      const tool = getTools(server)["health"];
      const result = (await tool.handler({}, {})) as {
        content: { type: string; text: string }[];
      };

      expect(JSON.parse(result.content[0].text)).toEqual(responseData);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/api/v1/health");
    });
  });

  // -------------------------------------------------------------------------
  // Error propagation through tools
  // -------------------------------------------------------------------------

  describe("tool error propagation", () => {
    it("get_portfolio rejects when client throws an API error", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: { get: () => null },
        json: vi.fn().mockResolvedValue({ message: "forbidden" }),
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue({ message: "forbidden" }),
        }),
      });

      const tool = getTools(server)["get_portfolio"];
      await expect(tool.handler({}, {})).rejects.toThrow(
        /Carbon Copy API error 403/,
      );
    });
  });
});
