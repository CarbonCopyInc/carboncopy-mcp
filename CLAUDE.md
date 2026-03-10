# Carbon Copy MCP Server

MCP (Model Context Protocol) server that wraps the Carbon Copy REST API, enabling AI agents to manage Polymarket copy-trading portfolios.

## Build & Run

```bash
npm install
npm run build         # TypeScript → dist/
npm run dev           # Dev mode with watch
npx @carbon-copy/mcp  # Run via npx (after publish)
```

## Configuration

Set `CARBONCOPY_API_KEY` env var (format: `cc_<64 hex chars>`).

```json
{
  "mcpServers": {
    "carboncopy": {
      "command": "npx",
      "args": ["@carbon-copy/mcp"],
      "env": { "CARBONCOPY_API_KEY": "cc_..." }
    }
  }
}
```

## Structure

```
src/
  index.ts            # McpServer setup + stdio transport
  client.ts           # HTTP client for CC REST API
  tools/
    portfolio.ts      # get_portfolio, get_history, get_positions
    traders.ts        # list/follow/update/unfollow/pause/resume
    orders.ts         # list_orders, get_order
    account.ts        # get_account, health
  resources/
    portfolio.ts      # carboncopy://portfolio
    traders.ts        # carboncopy://traders
```

## Public API Ecosystem

Carbon Copy has three repos that form the public API surface:

| Repo | Purpose | Deploys to |
|---|---|---|
| `CarbonCopyInc/habakkuk` | App + Convex backend + REST API (source of truth) | Vercel + Convex |
| `CarbonCopyInc/docs` | Mintlify API documentation | Mintlify |
| `CarbonCopyInc/carboncopy-mcp` (this repo) | MCP server | npm (`@carbon-copy/mcp`) |

### Sync Rules

- **`habakkuk` is the source of truth** for API behavior. This server wraps it.
- This is a **thin fetch wrapper** — it does NOT parse or validate API response fields.
- Only needs updating when endpoints are added, removed, or renamed.
- Auth is handled via `CARBONCOPY_API_KEY` env var. No OAuth flows.

## Conventions

- Use `@modelcontextprotocol/sdk` (spec version 2025-11-25)
- All tools must include `annotations` (readOnlyHint, destructiveHint, etc.)
- All tools must return `structuredContent` alongside text content
- Use `zod` for input/output schemas
- Tool names use snake_case (`get_portfolio`, not `getPortfolio`)
