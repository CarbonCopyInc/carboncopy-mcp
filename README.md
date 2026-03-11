# Carbon Copy MCP Server

An [MCP](https://modelcontextprotocol.io) server that gives AI agents programmatic access to [Carbon Copy](https://carboncopy.inc) — a Polymarket copy-trading platform.

## Features

- **Portfolio Management** — View portfolio summary, positions, and trade history
- **Trader Operations** — Follow/unfollow traders, pause/resume copy trading, adjust settings
- **Order Tracking** — List and inspect copy trade orders with filtering
- **Account Info** — Access account details
- **Cursor Pagination** — Iterate through large datasets efficiently

## Quick Start

### Prerequisites

1. A [Carbon Copy](https://carboncopy.inc) account
2. An API key (generate from the dashboard or via the [API](https://docs.carboncopy.inc))

### Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "carboncopy": {
      "command": "npx",
      "args": ["-y", "@carbon-copy/mcp"],
      "env": {
        "CARBONCOPY_API_KEY": "cc_your_key_here"
      }
    }
  }
}
```

### Usage with Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "carboncopy": {
      "command": "npx",
      "args": ["-y", "@carbon-copy/mcp"],
      "env": {
        "CARBONCOPY_API_KEY": "cc_your_key_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|---|---|
| `get_portfolio` | Portfolio summary (value, P&L, win rate) |
| `get_portfolio_history` | Paginated trade history with date filtering |
| `get_positions` | Open positions with pagination |
| `list_traders` | All followed traders with stats |
| `discover_traders` | Discover/search traders you can follow |
| `follow_trader` | Start following a trader |
| `get_trader` | Single trader details |
| `get_trader_performance` | Trader performance metrics/history |
| `update_trader` | Update copy trading settings |
| `batch_update_traders` | Update multiple followed traders in one call |
| `unfollow_trader` | Stop following a trader |
| `pause_trader` | Pause copy trading for a trader |
| `resume_trader` | Resume copy trading for a trader |
| `list_orders` | Paginated orders with status/date filters |
| `get_order` | Single order details |
| `get_account` | Account information |
| `health` | API health check |

## Resources

| URI | Description |
|---|---|
| `carboncopy://portfolio` | Current portfolio snapshot |
| `carboncopy://traders` | List of followed traders |

## Development

```bash
npm install
npm run build
npm run dev           # Watch mode
```

## Authentication

All tools use your `CARBONCOPY_API_KEY` (format: `cc_<64 hex chars>`). Generate one from the [Carbon Copy dashboard](https://carboncopy.inc) or via the [Key Management API](https://docs.carboncopy.inc/authentication).

You can override the API origin with `CARBONCOPY_BASE_URL` if needed. By default the MCP server targets `https://carboncopy.inc`.

API keys have scoped permissions (portfolio, traders, orders, markets, account). Tools will return permission errors if your key lacks the required scope.

## Rate Limits

The underlying API enforces rate limits (60 reads/min, 20 writes/min). The MCP server surfaces rate limit errors transparently — retry after the indicated delay.

## Links

- [Carbon Copy](https://carboncopy.inc)
- [API Documentation](https://docs.carboncopy.inc)
- [OpenAPI Spec](https://docs.carboncopy.inc/api-reference/openapi.json)

## License

MIT
