import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarbonCopyClient } from "../client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockResponseOptions = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  contentLength?: string;
  body?: unknown;
  bodyText?: string;
  /** If true, cloned.json() rejects (tests the text() fallback path) */
  cloneJsonThrows?: boolean;
};

function createMockResponse(opts: MockResponseOptions = {}) {
  const {
    ok = true,
    status = 200,
    statusText = "OK",
    contentLength,
    body = null,
    bodyText = "",
    cloneJsonThrows = false,
  } = opts;

  const headers: Record<string, string> = {};
  if (contentLength !== undefined) headers["content-length"] = contentLength;

  const jsonFn = vi.fn().mockResolvedValue(body);
  const textFn = vi
    .fn()
    .mockResolvedValue(bodyText || (body !== null ? JSON.stringify(body) : ""));

  // The clone is only used for error-path json parsing
  const cloneJsonFn = cloneJsonThrows
    ? vi.fn().mockRejectedValue(new Error("not json"))
    : vi.fn().mockResolvedValue(body);

  const clone = vi.fn().mockReturnValue({ json: cloneJsonFn });

  return {
    ok,
    status,
    statusText,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: jsonFn,
    text: textFn,
    clone,
  };
}

const BASE = "https://www.carboncopy.inc";

describe("CarbonCopyClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: CarbonCopyClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    client = new CarbonCopyClient("cc_testkey");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Core request behaviour
  // -------------------------------------------------------------------------

  describe("request() — GET", () => {
    it("sends correct URL and Authorization header, returns parsed JSON", async () => {
      const data = { total: 42 };
      fetchMock.mockResolvedValue(createMockResponse({ body: data }));

      const result = await client.getPortfolio();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio`);
      expect((init.headers as Record<string, string>)["Authorization"]).toBe(
        "Bearer cc_testkey",
      );
      expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json",
      );
      expect(init.method).toBe("GET");
      expect(init.body).toBeUndefined();
      expect(result).toEqual(data);
    });
  });

  describe("request() — POST", () => {
    it("serialises body to JSON and sends correct method", async () => {
      const responseData = { id: "trader-1" };
      fetchMock.mockResolvedValue(createMockResponse({ body: responseData }));

      const payload = {
        wallet: "0xabc",
        copyPercentage: 50,
      };
      await client.followTrader(payload);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("POST");
      expect(init.body).toBe(
        JSON.stringify({
          walletAddress: payload.wallet,
          copyPercentage: payload.copyPercentage,
        }),
      );
    });
  });

  describe("request() — error handling", () => {
    it("throws an error including status and response body when response is not ok", async () => {
      const errBody = { message: "Unauthorized" };
      fetchMock.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          body: errBody,
        }),
      );

      await expect(client.getPortfolio()).rejects.toThrow(
        /Carbon Copy API error 401 Unauthorized/,
      );
      await expect(client.getPortfolio()).rejects.toThrow(/Unauthorized/);
    });

    it("falls back to res.text() when cloned.json() fails on error response", async () => {
      fetchMock.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          bodyText: "raw error text",
          cloneJsonThrows: true,
        }),
      );

      await expect(client.getPortfolio()).rejects.toThrow(/raw error text/);
    });
  });

  describe("request() — empty body handling", () => {
    it("returns undefined for 204 No Content without calling res.json()", async () => {
      const mock = createMockResponse({ status: 204 });
      // ok defaults true but 204 has no body
      fetchMock.mockResolvedValue({ ...mock, ok: true, status: 204 });

      const result = await client.unfollowTrader("0xabc");
      expect(result).toBeUndefined();
      expect(mock.json).not.toHaveBeenCalled();
    });

    it("returns undefined when Content-Length is 0", async () => {
      const mock = createMockResponse({ contentLength: "0" });
      fetchMock.mockResolvedValue(mock);

      const result = await client.pauseTrader("0xabc");
      expect(result).toBeUndefined();
      expect(mock.json).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // buildQuery (tested via endpoint methods)
  // -------------------------------------------------------------------------

  describe("buildQuery", () => {
    it("appends query string for defined values", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ body: [] }));
      await client.getPortfolioHistory({ limit: 10, cursor: "abc" });

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("limit=10");
      expect(url).toContain("cursor=abc");
    });

    it("omits undefined values from query string", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ body: [] }));
      await client.getPortfolioHistory({ limit: 5 });

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("limit=5");
      expect(url).not.toContain("cursor");
      expect(url).not.toContain("since");
      expect(url).not.toContain("until");
    });

    it("omits query string entirely when params are all undefined", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ body: [] }));
      await client.getPositions({});

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toBe(`${BASE}/api/v1/portfolio/positions`);
      expect(url).not.toContain("?");
    });
  });

  // -------------------------------------------------------------------------
  // Endpoint methods — method + path
  // -------------------------------------------------------------------------

  describe("endpoint methods", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(createMockResponse({ body: {} }));
    });

    it("getPortfolio() → GET /api/v1/portfolio", async () => {
      await client.getPortfolio();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio`);
      expect(init.method).toBe("GET");
    });

    it("getPortfolioHistory({limit:10, cursor:'abc'}) → GET /api/v1/portfolio/history?limit=10&cursor=abc", async () => {
      await client.getPortfolioHistory({ limit: 10, cursor: "abc" });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/history?limit=10&cursor=abc`);
      expect(init.method).toBe("GET");
    });

    it("getPositions() → GET /api/v1/portfolio/positions", async () => {
      await client.getPositions();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/positions`);
      expect(init.method).toBe("GET");
    });

    it("getTraders() → GET /api/v1/portfolio/traders", async () => {
      await client.getTraders();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders`);
      expect(init.method).toBe("GET");
    });

    it("discoverTraders({sortBy:'roi'}) → GET /api/v1/traders?sortBy=roi", async () => {
      await client.discoverTraders({ sortBy: "roi" });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/traders?sortBy=roi`);
      expect(init.method).toBe("GET");
    });

    it("followTrader({...}) → POST /api/v1/portfolio/traders with body", async () => {
      const body = {
        wallet: "0xabc",
        copyPercentage: 50,
        maxCopyAmount: 100,
        notificationsEnabled: true,
      };
      await client.followTrader(body);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({
        walletAddress: body.wallet,
        copyPercentage: body.copyPercentage,
        maxCopyAmount: body.maxCopyAmount,
        notificationsEnabled: body.notificationsEnabled,
      });
    });

    it("getTrader('0xabc') → GET /api/v1/portfolio/traders/0xabc", async () => {
      await client.getTrader("0xabc");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders/0xabc`);
      expect(init.method).toBe("GET");
    });

    it("updateTrader('0xabc', {...}) → PATCH /api/v1/portfolio/traders/0xabc with body", async () => {
      const body = { copyPercentage: 75, copyTradingEnabled: false };
      await client.updateTrader("0xabc", body);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders/0xabc`);
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body as string)).toEqual(body);
    });

    it("unfollowTrader('0xabc') → DELETE /api/v1/portfolio/traders/0xabc", async () => {
      fetchMock.mockResolvedValue(
        createMockResponse({ status: 204, ok: true }),
      );
      await client.unfollowTrader("0xabc");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders/0xabc`);
      expect(init.method).toBe("DELETE");
    });

    it("pauseTrader('0xabc') → POST /api/v1/portfolio/traders/0xabc/pause", async () => {
      await client.pauseTrader("0xabc");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders/0xabc/pause`);
      expect(init.method).toBe("POST");
    });

    it("resumeTrader('0xabc') → POST /api/v1/portfolio/traders/0xabc/resume", async () => {
      await client.resumeTrader("0xabc");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders/0xabc/resume`);
      expect(init.method).toBe("POST");
    });

    it("getTraderPerformance('0xabc') → GET /api/v1/traders/0xabc/performance", async () => {
      await client.getTraderPerformance("0xabc");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/traders/0xabc/performance`);
      expect(init.method).toBe("GET");
    });

    it("batchUpdateTraders([...]) → PATCH /api/v1/portfolio/traders/batch", async () => {
      const updates = [{ walletAddress: "0xabc", copyPercentage: 70 }];
      await client.batchUpdateTraders(updates);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/portfolio/traders/batch`);
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body as string)).toEqual({ updates });
    });

    it("getOrders({status:'filled'}) → GET /api/v1/orders?status=filled", async () => {
      await client.getOrders({ status: "filled" });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/orders?status=filled`);
      expect(init.method).toBe("GET");
    });

    it("getOrder('id123') → GET /api/v1/orders/id123", async () => {
      await client.getOrder("id123");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/orders/id123`);
      expect(init.method).toBe("GET");
    });

    it("getAccount() → GET /api/v1/account", async () => {
      await client.getAccount();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/account`);
      expect(init.method).toBe("GET");
    });

    it("health() → GET /api/v1/health", async () => {
      await client.health();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/api/v1/health`);
      expect(init.method).toBe("GET");
    });
  });

  // -------------------------------------------------------------------------
  // URL encoding
  // -------------------------------------------------------------------------

  describe("URL encoding", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(createMockResponse({ body: {} }));
    });

    it("encodes wallet addresses with special characters in path", async () => {
      const wallet = "0xabc/def?foo=bar&baz=qux";
      await client.getTrader(wallet);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain(encodeURIComponent(wallet));
      expect(url).not.toContain("?foo=bar");
    });

    it("encodes order IDs with special characters", async () => {
      const id = "order/id?test=1";
      await client.getOrder(id);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain(encodeURIComponent(id));
    });

    it("encodes wallet addresses for updateTrader", async () => {
      const wallet = "0xabc def";
      await client.updateTrader(wallet, { copyPercentage: 10 });
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain(encodeURIComponent(wallet));
      expect(url).toBe(
        `${BASE}/api/v1/portfolio/traders/${encodeURIComponent(wallet)}`,
      );
    });

    it("encodes wallet addresses for unfollowTrader", async () => {
      const wallet = "0xabc def";
      fetchMock.mockResolvedValue(
        createMockResponse({ status: 204, ok: true }),
      );
      await client.unfollowTrader(wallet);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toBe(
        `${BASE}/api/v1/portfolio/traders/${encodeURIComponent(wallet)}`,
      );
    });

    it("encodes wallet addresses for pauseTrader", async () => {
      const wallet = "0xabc def";
      await client.pauseTrader(wallet);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toBe(
        `${BASE}/api/v1/portfolio/traders/${encodeURIComponent(wallet)}/pause`,
      );
    });

    it("encodes wallet addresses for resumeTrader", async () => {
      const wallet = "0xabc def";
      await client.resumeTrader(wallet);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toBe(
        `${BASE}/api/v1/portfolio/traders/${encodeURIComponent(wallet)}/resume`,
      );
    });

    it("encodes query string values correctly", async () => {
      await client.getPortfolioHistory({ cursor: "abc=def&ghi" });
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("cursor=abc%3Ddef%26ghi");
    });
  });
});
