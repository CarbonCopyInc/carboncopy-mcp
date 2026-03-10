const BASE_URL = "https://carboncopy.news";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export class CarbonCopyClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const cloned = res.clone();
      let errorBody: unknown;
      try {
        errorBody = await cloned.json();
      } catch {
        errorBody = await res.text();
      }
      throw new Error(
        `Carbon Copy API error ${res.status} ${res.statusText}: ${JSON.stringify(errorBody)}`
      );
    }

    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as unknown as T;
    }

    const text = await res.text();
    if (!text) return undefined as unknown as T;
    return JSON.parse(text) as T;
  }

  // Portfolio
  getPortfolio(): Promise<unknown> {
    return this.request("GET", "/api/v1/portfolio");
  }

  getPortfolioHistory(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
    until?: string;
  }): Promise<unknown> {
    const qs = buildQuery(params ?? {});
    return this.request("GET", `/api/v1/portfolio/history${qs}`);
  }

  getPositions(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
    until?: string;
  }): Promise<unknown> {
    const qs = buildQuery(params ?? {});
    return this.request("GET", `/api/v1/portfolio/positions${qs}`);
  }

  // Traders
  getTraders(): Promise<unknown> {
    return this.request("GET", "/api/v1/traders");
  }

  followTrader(body: {
    walletAddress: string;
    copyPercentage: number;
    maxCopyAmount?: number;
    notificationsEnabled?: boolean;
  }): Promise<unknown> {
    return this.request("POST", "/api/v1/traders", body);
  }

  getTrader(wallet: string): Promise<unknown> {
    return this.request("GET", `/api/v1/traders/${encodeURIComponent(wallet)}`);
  }

  updateTrader(
    wallet: string,
    body: {
      copyPercentage?: number;
      maxCopyAmount?: number;
      notificationsEnabled?: boolean;
      copyTradingEnabled?: boolean;
    }
  ): Promise<unknown> {
    return this.request(
      "PATCH",
      `/api/v1/traders/${encodeURIComponent(wallet)}`,
      body
    );
  }

  unfollowTrader(wallet: string): Promise<unknown> {
    return this.request(
      "DELETE",
      `/api/v1/traders/${encodeURIComponent(wallet)}`
    );
  }

  pauseTrader(wallet: string): Promise<unknown> {
    return this.request(
      "POST",
      `/api/v1/traders/${encodeURIComponent(wallet)}/pause`
    );
  }

  resumeTrader(wallet: string): Promise<unknown> {
    return this.request(
      "POST",
      `/api/v1/traders/${encodeURIComponent(wallet)}/resume`
    );
  }

  // Orders
  getOrders(params?: {
    status?: string;
    limit?: number;
    cursor?: string;
    since?: string;
    until?: string;
  }): Promise<unknown> {
    const qs = buildQuery(params ?? {});
    return this.request("GET", `/api/v1/orders${qs}`);
  }

  getOrder(id: string): Promise<unknown> {
    return this.request("GET", `/api/v1/orders/${encodeURIComponent(id)}`);
  }

  // Account
  getAccount(): Promise<unknown> {
    return this.request("GET", "/api/v1/account");
  }

  health(): Promise<unknown> {
    return this.request("GET", "/api/v1/health");
  }
}
