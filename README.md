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

## Running Modes

This package supports two first-class transports from one shared tool/resource surface:

- **stdio mode** (`carboncopy-mcp`) for local subprocess clients (Claude Desktop, Cursor, etc.)
- **hosted Streamable HTTP mode** (`carboncopy-mcp-http`) for remotely hosted MCP

## Configuration

### Required env vars (all modes)

- `CARBONCOPY_API_KEY` (required): Carbon Copy API key (`cc_<64 hex chars>`)

### Optional API env vars

- `CARBONCOPY_BASE_URL` (optional): Carbon Copy API origin (default: `https://www.carboncopy.inc`)

### Required env vars (HTTP mode)

- `MCP_HTTP_BEARER_TOKEN` (required): inbound bearer token used to authenticate all MCP HTTP requests

### Optional env vars (HTTP mode)

- `MCP_HTTP_HOST` (default: `127.0.0.1`)
- `MCP_HTTP_PORT` (default: `3000`)
- `MCP_HTTP_ENDPOINT` (default: `/mcp`)
- `MCP_HTTP_MAX_BODY_BYTES` (default: `1048576` / 1 MiB)
- `MCP_HTTP_ALLOWED_ORIGINS` (optional CSV allow-list; default empty = block all cross-origin browser requests unless explicitly listed)
- `MCP_HTTP_ALLOWED_HOSTS` (optional CSV allow-list; defaults are derived from bind host)

Host default behavior when `MCP_HTTP_ALLOWED_HOSTS` is unset:

- `MCP_HTTP_HOST=127.0.0.1` → allow `127.0.0.1`, `localhost`
- `MCP_HTTP_HOST=::1` → allow `[::1]`, `localhost`
- `MCP_HTTP_HOST=0.0.0.0` / `::` → allow only local hostnames by default (`localhost`, `127.0.0.1`, `[::1]`)

For public deployments, explicitly set both `MCP_HTTP_ALLOWED_HOSTS` and `MCP_HTTP_ALLOWED_ORIGINS`.

## Usage (stdio)

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Cursor

Add to `.cursor/mcp.json`:

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

## Usage (hosted Streamable HTTP)

### Run locally

```bash
CARBONCOPY_API_KEY=cc_your_key_here \
MCP_HTTP_BEARER_TOKEN=replace-with-strong-secret \
npm run start:http
```

or via npx without installing:

```bash
CARBONCOPY_API_KEY=cc_your_key_here \
MCP_HTTP_BEARER_TOKEN=replace-with-strong-secret \
npx -y -p @carbon-copy/mcp carboncopy-mcp-http
```

### Deploy

Set environment variables in your hosting platform and expose:

- `http://<host>:<port><endpoint>` (default `http://127.0.0.1:3000/mcp`)

For production, set at least:

- `MCP_HTTP_HOST=0.0.0.0` (or platform equivalent)
- `MCP_HTTP_PORT=<platform port>`
- `MCP_HTTP_ENDPOINT=/mcp` (or your preferred path)
- `MCP_HTTP_BEARER_TOKEN=<long-random-secret>`
- `MCP_HTTP_ALLOWED_HOSTS=<public hostnames>`
- `MCP_HTTP_ALLOWED_ORIGINS=<trusted web origins>`
- `MCP_HTTP_MAX_BODY_BYTES=<appropriate limit>`

### Client connection to hosted endpoint

Configure your MCP client to use Streamable HTTP URL mode and send `Authorization: Bearer <MCP_HTTP_BEARER_TOKEN>` to your hosted endpoint, for example:

```json
{
  "mcpServers": {
    "carboncopy-http": {
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer replace-with-your-token"
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
| `get_pnl_history` | Time-series portfolio P&L snapshots for charting |
| `close_position` | Close an open position by selling shares |
| `get_pnl_by_trader` | Realised P&L grouped by trader |
| `get_pnl_by_market` | Realised P&L grouped by market |

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

All tools return both JSON text content and `structuredContent` in MCP responses.

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
npm run start         # stdio entrypoint
npm run start:http    # hosted streamable HTTP entrypoint
```

## Authentication

All tools authenticate upstream via `CARBONCOPY_API_KEY` (format: `cc_<64 hex chars>`). Generate keys from the [Carbon Copy dashboard](https://carboncopy.inc).

In hosted HTTP mode, inbound requests must also present `Authorization: Bearer <MCP_HTTP_BEARER_TOKEN>`.

API keys carry **scoped permissions** (`portfolio`, `traders`, `orders`, `markets`, `account`). Tools return a `403` permission error if your key lacks the required scope.

## Rate Limits

The API enforces rate limits (60 reads/min, 20 writes/min). The MCP server surfaces rate limit errors transparently — retry after the indicated delay.

## Links

- [Carbon Copy](https://carboncopy.inc)
- [API Reference](https://github.com/CarbonCopyInc/habakkuk/blob/main/docs/API_REFERENCE.md)
- [OpenAPI Spec](https://docs.carboncopy.inc/api-reference/openapi.json)

## License

MIT
