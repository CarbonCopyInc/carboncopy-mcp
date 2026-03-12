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
}
