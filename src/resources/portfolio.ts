import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CarbonCopyClient } from "../client.js";

export function registerPortfolioResources(
  server: McpServer,
  client: CarbonCopyClient
): void {
  server.registerResource(
    "portfolio",
    "carboncopy://portfolio",
    {
      title: "Carbon Copy Portfolio",
      description:
        "Current portfolio snapshot including total value, P&L, and allocation.",
      mimeType: "application/json",
    },
    async () => {
      const data = await client.getPortfolio();
      return {
        contents: [
          {
            uri: "carboncopy://portfolio",
            mimeType: "application/json",
            text: JSON.stringify(data ?? {}, null, 2),
          },
        ],
      };
    }
  );
}
