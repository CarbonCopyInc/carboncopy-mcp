#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCarbonCopyMcpServer } from "./server.js";

try {
  const { server } = createCarbonCopyMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
} catch (error) {
  process.stderr.write(
    `Error: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
