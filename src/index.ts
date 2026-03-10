#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CarbonCopyClient } from "./client.js";
import { registerPortfolioTools } from "./tools/portfolio.js";
import { registerTraderTools } from "./tools/traders.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerAccountTools } from "./tools/account.js";
import { registerPortfolioResources } from "./resources/portfolio.js";
import { registerTraderResources } from "./resources/traders.js";

const apiKey = process.env.CARBONCOPY_API_KEY;
if (!apiKey) {
  console.error(
    "Error: CARBONCOPY_API_KEY environment variable is required.\n" +
      "Set it to your Carbon Copy API key (format: cc_<64 hex chars>)."
  );
  process.exit(1);
}

const client = new CarbonCopyClient(apiKey);

const server = new McpServer({
  name: "carboncopy",
  version: "0.1.0",
});

// Register tools
registerPortfolioTools(server, client);
registerTraderTools(server, client);
registerOrderTools(server, client);
registerAccountTools(server, client);

// Register resources
registerPortfolioResources(server, client);
registerTraderResources(server, client);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
