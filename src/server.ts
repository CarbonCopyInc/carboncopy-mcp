import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CarbonCopyClient } from "./client.js";
import { requireCarbonCopyApiKey } from "./config.js";
import { registerPortfolioResources } from "./resources/portfolio.js";
import { registerTraderResources } from "./resources/traders.js";
import { registerAccountTools } from "./tools/account.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerPortfolioTools } from "./tools/portfolio.js";
import { registerTraderTools } from "./tools/traders.js";

export const SERVER_NAME = "carboncopy";
export const SERVER_VERSION = "0.1.0";

export type CarbonCopyMcpServer = {
  server: McpServer;
  client: CarbonCopyClient;
};

export function createCarbonCopyMcpServer(
  env: NodeJS.ProcessEnv = process.env,
): CarbonCopyMcpServer {
  const apiKey = requireCarbonCopyApiKey(env);
  const client = new CarbonCopyClient(apiKey);

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerPortfolioTools(server, client);
  registerTraderTools(server, client);
  registerOrderTools(server, client);
  registerAccountTools(server, client);

  registerPortfolioResources(server, client);
  registerTraderResources(server, client);

  return { server, client };
}
