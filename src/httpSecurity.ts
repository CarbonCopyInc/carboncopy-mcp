import type { ServerResponse } from "node:http";

export class PayloadTooLargeError extends Error {
  constructor(message = "Request body too large") {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

export type BodyReadableRequest = {
  method?: string;
} & AsyncIterable<Buffer | Uint8Array | string>;

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export function isAuthorizedRequest(
  authHeader: string | undefined,
  expectedToken: string,
): boolean {
  const token = extractBearerToken(authHeader);
  return token === expectedToken;
}

export async function readJsonBodyWithLimit(
  req: BodyReadableRequest,
  maxBodyBytes: number,
): Promise<unknown | undefined> {
  if (req.method !== "POST") return undefined;

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bufferChunk.length;

    if (totalBytes > maxBodyBytes) {
      throw new PayloadTooLargeError(
        `Request body exceeded ${maxBodyBytes} bytes limit`,
      );
    }

    chunks.push(bufferChunk);
  }

  if (chunks.length === 0) return undefined;

  const bodyText = Buffer.concat(chunks).toString("utf8").trim();
  if (!bodyText) return undefined;

  return JSON.parse(bodyText) as unknown;
}

export function writeJson(
  res: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
): void {
  const text = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", Buffer.byteLength(text));
  res.end(text);
}
