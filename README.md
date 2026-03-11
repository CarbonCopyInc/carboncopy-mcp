# Carbon Copy MCP Server

An [MCP](https://modelcontextprotocol.io) server that gives AI agents programmatic access to [Carbon Copy](https://carboncopy.inc) — a Polymarket copy-trading platform.

## Features

- **Portfolio Management** — View portfolio summary (including live positions value and unrealised P&L), open positions, and trade history
- **Trader Discovery** — Search and filter traders by profit, ROI, win rate, volume, and followers
- **Follow Management** — Follow/unfollow traders, pause/resume copy trading, adjust per-trader settings
- **Batch Operations** — Update up to 100 followed traders in a single call
- **Performance Analytics** — Trader P&L history, drawdown, and Sharpe ratio
- **Order Tracking** — List and inspect copy trade orders with filtering
- **Account Info** — Access account details
- **Cursor Pagination** — Iterate through large datasets efficiently

## Quick Start

### Prerequisites

1. A [Carbon Copy](https://carboncopy.inc) account
2. An API key (generate from the dashboard)

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

### Portfolio

| Tool | Description |
|------|-------------|
| `get_portfolio` | Portfolio summary: balance, positions value, unrealised P&L, win rate |
| `get_portfolio_history` | Paginated trade history with optional date filtering |
| `get_positions` | Open positions with pagination |

### Trader Discovery

| Tool | Description |
|------|-------------|
| `discover_traders` | Search/filter traders by profit, ROI, win rate, volume, followers |
| `get_trader_performance` | Detailed performance analytics and P&L history for a trader |

### Follow Management

| Tool | Description |
|------|-------------|
| `list_traders` | All followed traders with copy settings and stats |
| `follow_trader` | Start following a trader |
| `get_trader` | Details for a single followed trader |
| `update_trader` | Update copy trading settings for a followed trader |
| `batch_update_traders` | Update up to 100 followed traders in one call |
| `unfollow_trader` | Stop following a trader |
| `pause_trader` | Pause copy trading for a trader (without unfollowing) |
| `resume_trader` | Resume copy trading for a paused trader |

### Orders & Account

| Tool | Description |
|------|-------------|
| `list_orders` | Paginated orders with optional status/date filters |
| `get_order` | Single order details |
| `get_account` | Account information |
| `health` | API health check |

## Resources

| URI | Description |
|-----|-------------|
| `carboncopy://portfolio` | Current portfolio snapshot |
| `carboncopy://traders` | Followed traders list |

## Development

```bash
npm install
npm run build
npm run dev           # Watch mode
npm test              # Run tests
```

## Authentication

All tools authenticate via `CARBONCOPY_API_KEY` (format: `cc_<64 hex chars>`). Generate keys from the [Carbon Copy dashboard](https://carboncopy.inc).

API keys carry **scoped permissions** (`portfolio`, `traders`, `orders`, `markets`, `account`). Tools return a `403` permission error if your key lacks the required scope.

You can override the default API origin with `CARBONCOPY_BASE_URL` (defaults to `https://carboncopy.inc`).

## Rate Limits

The API enforces rate limits (60 reads/min, 20 writes/min). The MCP server surfaces rate limit errors transparently — retry after the indicated delay.

## Links

- [Carbon Copy](https://carboncopy.inc)
- [API Reference](https://github.com/CarbonCopyInc/habakkuk/blob/main/docs/API_REFERENCE.md)
- [OpenAPI Spec](https://docs.carboncopy.inc/api-reference/openapi.json)

## License

MIT
