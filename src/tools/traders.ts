import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CarbonCopyClient } from "../client.js";

export function registerTraderTools(
  server: McpServer,
  client: CarbonCopyClient
): void {
  server.registerTool(
    "list_traders",
    {
      title: "List Traders",
      description: "List all traders you are currently following.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const data = await client.getTraders();
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "follow_trader",
    {
      title: "Follow Trader",
      description:
        "Start copy-trading a Polymarket trader by their wallet address.",
      inputSchema: z.object({
        walletAddress: z
          .string()
          .describe("The Polymarket wallet address of the trader to follow."),
        copyPercentage: z
          .number()
          .min(0)
          .max(100)
          .describe("Percentage of the trader's position size to copy (0–100)."),
        maxCopyAmount: z
          .number()
          .positive()
          .optional()
          .describe("Maximum USDC amount to copy per trade."),
        notificationsEnabled: z
          .boolean()
          .optional()
          .describe("Whether to receive notifications for this trader's trades."),
      }),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      const data = await client.followTrader(params);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_trader",
    {
      title: "Get Trader",
      description:
        "Retrieve details about a specific trader you are following.",
      inputSchema: z.object({
        wallet: z
          .string()
          .describe("The Polymarket wallet address of the trader."),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ wallet }) => {
      const data = await client.getTrader(wallet);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_trader",
    {
      title: "Update Trader",
      description:
        "Update copy-trading settings for a trader you are following.",
      inputSchema: z.object({
        wallet: z
          .string()
          .describe("The Polymarket wallet address of the trader to update."),
        copyPercentage: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe("New copy percentage (0–100)."),
        maxCopyAmount: z
          .number()
          .positive()
          .optional()
          .describe("New maximum USDC amount per trade."),
        notificationsEnabled: z
          .boolean()
          .optional()
          .describe("Whether to receive notifications for this trader's trades."),
        copyTradingEnabled: z
          .boolean()
          .optional()
          .describe("Whether copy-trading is enabled for this trader."),
      }),
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ wallet, ...body }) => {
      const data = await client.updateTrader(wallet, body);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "unfollow_trader",
    {
      title: "Unfollow Trader",
      description:
        "Stop copy-trading a trader and remove them from your follow list.",
      inputSchema: z.object({
        wallet: z
          .string()
          .describe("The Polymarket wallet address of the trader to unfollow."),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    async ({ wallet }) => {
      const data = await client.unfollowTrader(wallet);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "pause_trader",
    {
      title: "Pause Trader",
      description:
        "Pause copy-trading for a specific trader without unfollowing them.",
      inputSchema: z.object({
        wallet: z
          .string()
          .describe("The Polymarket wallet address of the trader to pause."),
      }),
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ wallet }) => {
      const data = await client.pauseTrader(wallet);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "resume_trader",
    {
      title: "Resume Trader",
      description: "Resume copy-trading for a previously paused trader.",
      inputSchema: z.object({
        wallet: z
          .string()
          .describe("The Polymarket wallet address of the trader to resume."),
      }),
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ wallet }) => {
      const data = await client.resumeTrader(wallet);
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? { success: true }, null, 2) }],
      };
    }
  );
}
