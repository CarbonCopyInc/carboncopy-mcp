import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CarbonCopyClient } from "../client.js";

export function registerPortfolioTools(
  server: McpServer,
  client: CarbonCopyClient
): void {
  server.registerTool(
    "get_portfolio",
    {
      title: "Get Portfolio",
      description:
        "Retrieve the current portfolio summary including total value, P&L, and allocation.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const data = await client.getPortfolio();
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_portfolio_history",
    {
      title: "Get Portfolio History",
      description:
        "Retrieve paginated copy-trade history with optional date filtering.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Maximum number of records to return."),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from a previous response."),
        since: z
          .string()
          .optional()
          .describe("ISO 8601 timestamp — only return records after this time."),
        until: z
          .string()
          .optional()
          .describe("ISO 8601 timestamp — only return records before this time."),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const data = await client.getPortfolioHistory(params);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_positions",
    {
      title: "Get Positions",
      description:
        "Retrieve current or historical portfolio positions with optional pagination and date filtering.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Maximum number of records to return."),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from a previous response."),
        since: z
          .string()
          .optional()
          .describe("ISO 8601 timestamp — only return records after this time."),
        until: z
          .string()
          .optional()
          .describe("ISO 8601 timestamp — only return records before this time."),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const data = await client.getPositions(params);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_pnl_history",
    {
      title: "Get PnL History",
      description:
        "Retrieve time-series portfolio P&L data for charting performance over time. Returns snapshots with realised/unrealised P&L breakdown.",
      inputSchema: z.object({
        days: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Number of days of history to return (default 30, max 90)."),
        interval: z
          .enum(["1h", "4h", "1d"])
          .default("1d")
          .describe("Aggregation interval for snapshots (default '1d'). Use '1h' or '4h' for more granularity."),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const data = await client.getPnlHistory({
        ...params,
        interval: params.interval ?? "1d",
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "close_position",
    {
      title: "Close Position",
      description:
        "Close an open position by selling shares back to the market.",
      inputSchema: z.object({
        positionId: z.string().describe("The ID of the copy trade/position to close."),
        marketSlug: z.string().describe("The market slug identifier."),
        direction: z.string().describe("The position direction (e.g. 'Yes' or 'No')."),
        shares: z.number().positive().describe("Number of shares to sell."),
        outcome: z
          .string()
          .optional()
          .describe("The outcome token to sell (optional)."),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const data = await client.closePosition(params);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_pnl_by_trader",
    {
      title: "Get PnL by Trader",
      description:
        "Get a breakdown of realised P&L grouped by each trader you copy.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const data = await client.getPnlByTrader();
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );
}
