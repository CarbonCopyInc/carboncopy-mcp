import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CarbonCopyClient } from "../client.js";

export function registerAccountTools(
  server: McpServer,
  client: CarbonCopyClient
): void {
  server.registerTool(
    "get_account",
    {
      title: "Get Account",
      description:
        "Retrieve your Carbon Copy account details including wallet address, balance, and settings.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const data = await client.getAccount();
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "health",
    {
      title: "Health Check",
      description:
        "Check the health and availability of the Carbon Copy API.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const data = await client.health();
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );
}
