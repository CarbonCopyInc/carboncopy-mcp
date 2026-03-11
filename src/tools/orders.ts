import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CarbonCopyClient } from "../client.js";

export function registerOrderTools(
  server: McpServer,
  client: CarbonCopyClient,
): void {
  server.registerTool(
    "list_orders",
    {
      title: "List Orders",
      description:
        "Retrieve a list of copy-trade orders with optional status filter, pagination, and date range.",
      inputSchema: z.object({
        status: z
          .string()
          .optional()
          .describe(
            "Filter by order status (e.g. 'pending', 'filled', 'executed', 'cancelled').",
          ),
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
          .describe(
            "ISO 8601 timestamp — only return records after this time.",
          ),
        until: z
          .string()
          .optional()
          .describe(
            "ISO 8601 timestamp — only return records before this time.",
          ),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const data = await client.getOrders(params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data ?? { success: true }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_order",
    {
      title: "Get Order",
      description: "Retrieve details about a specific copy-trade order by ID.",
      inputSchema: z.object({
        id: z.string().describe("The order ID to retrieve."),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const data = await client.getOrder(id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data ?? { success: true }, null, 2),
          },
        ],
      };
    },
  );
}
