import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CarbonCopyClient } from "../client.js";

export function registerTraderResources(
  server: McpServer,
  client: CarbonCopyClient
): void {
  server.registerResource(
    "traders",
    "carboncopy://traders",
    {
      title: "Carbon Copy Traders",
      description: "List of all traders you are currently following.",
      mimeType: "application/json",
    },
    async () => {
      const data = await client.getTraders();
      return {
        contents: [
          {
            uri: "carboncopy://traders",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
}
