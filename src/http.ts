#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  isHostAllowed,
  isOriginAllowed,
  readHttpServerConfig,
} from "./config.js";
import {
  isAuthorizedRequest,
  PayloadTooLargeError,
  readJsonBodyWithLimit,
  writeJson,
} from "./httpSecurity.js";
import { createCarbonCopyMcpServer, SERVER_NAME } from "./server.js";

type SessionRuntime = {
  transport: StreamableHTTPServerTransport;
};

const sessionRuntimes = new Map<string, SessionRuntime>();
const config = readHttpServerConfig();

function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin;
  if (!origin) return;

  if (isOriginAllowed(origin, config.allowedOrigins)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
}

function extractHostCandidates(hostHeaderValue: string): string[] {
  const lowered = hostHeaderValue.toLowerCase();

  if (lowered.startsWith("[")) {
    const closingBracketIndex = lowered.indexOf("]");
    if (closingBracketIndex > 0) {
      return [
        lowered,
        lowered.slice(0, closingBracketIndex + 1),
        lowered.slice(1, closingBracketIndex),
      ];
    }

    return [lowered];
  }

  const [hostname] = lowered.split(":");
  return [lowered, hostname];
}

function rejectIfDisallowedHost(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  const hostHeader = req.headers.host;
  if (!hostHeader) {
    writeJson(res, 400, { error: "Missing Host header" });
    return true;
  }

  const candidates = extractHostCandidates(hostHeader);
  const allowed = candidates.some((candidate) =>
    isHostAllowed(candidate, config.allowedHosts),
  );

  if (!allowed) {
    writeJson(res, 403, { error: "Host is not allowed" });
    return true;
  }

  return false;
}

function rejectIfDisallowedOrigin(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  const origin = req.headers.origin;
  if (!origin) return false;

  if (!isOriginAllowed(origin, config.allowedOrigins)) {
    writeJson(res, 403, { error: "Origin is not allowed" });
    return true;
  }

  return false;
}

function isInitializeRequest(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;

  return (body as { method?: unknown }).method === "initialize";
}

async function createSessionRuntime(): Promise<SessionRuntime> {
  const { server } = createCarbonCopyMcpServer();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessionRuntimes.set(sessionId, { transport });
    },
    onsessionclosed: (sessionId) => {
      sessionRuntimes.delete(sessionId);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessionRuntimes.delete(transport.sessionId);
    }
  };

  await server.connect(transport);

  return { transport };
}

async function getOrCreateRuntime(
  sessionId: string | undefined,
  isInitialization: boolean,
): Promise<SessionRuntime | undefined> {
  if (sessionId) {
    return sessionRuntimes.get(sessionId);
  }

  if (!isInitialization) return undefined;

  return createSessionRuntime();
}

function requestPath(req: IncomingMessage): string {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);
  return url.pathname;
}

function rejectIfUnauthorized(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;

  if (!isAuthorizedRequest(authHeader, config.authToken)) {
    res.setHeader("WWW-Authenticate", "Bearer");
    writeJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  return false;
}

const httpServer = createServer(async (req, res) => {
  try {
    setCorsHeaders(req, res);

    if (rejectIfDisallowedHost(req, res)) return;
    if (rejectIfDisallowedOrigin(req, res)) return;

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const path = requestPath(req);

    if (path === "/") {
      writeJson(res, 200, {
        name: SERVER_NAME,
        transport: "streamable-http",
        endpoint: config.endpoint,
      });
      return;
    }

    if (path !== config.endpoint) {
      writeJson(res, 404, { error: "Not Found" });
      return;
    }

    if (rejectIfUnauthorized(req, res)) return;

    let body: unknown | undefined;
    try {
      body = await readJsonBodyWithLimit(req, config.maxBodyBytes);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        writeJson(res, 413, { error: error.message });
        return;
      }

      writeJson(res, 400, { error: "Malformed JSON body" });
      return;
    }

    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionIdHeader)
      ? sessionIdHeader[0]
      : sessionIdHeader;

    const runtime = await getOrCreateRuntime(
      sessionId,
      isInitializeRequest(body),
    );

    if (!runtime) {
      writeJson(res, 400, {
        error: "Bad Request: missing or invalid MCP session",
      });
      return;
    }

    await runtime.transport.handleRequest(req, res, body);
  } catch (error) {
    if (!res.headersSent) {
      writeJson(res, 500, {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
      });
    } else {
      res.end();
    }
  }
});

httpServer.listen(config.port, config.host, () => {
  process.stderr.write(
    `${SERVER_NAME}-mcp http listening on http://${config.host}:${config.port}${config.endpoint}\n`,
  );
});
