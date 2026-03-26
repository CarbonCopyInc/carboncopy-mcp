import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  extractBearerToken,
  isAuthorizedRequest,
  PayloadTooLargeError,
  readJsonBodyWithLimit,
} from "../httpSecurity.js";

type TestRequest = Readable & {
  method?: string;
};

function createRequest(method: string, body: string): TestRequest {
  const stream = Readable.from([Buffer.from(body, "utf8")]) as TestRequest;
  stream.method = method;
  return stream;
}

describe("httpSecurity", () => {
  it("extracts bearer tokens", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("Bearer secret")).toBe("secret");
  });

  it("validates bearer auth headers", () => {
    expect(isAuthorizedRequest("Bearer secret", "secret")).toBe(true);
    expect(isAuthorizedRequest("Bearer wrong", "secret")).toBe(false);
    expect(isAuthorizedRequest(undefined, "secret")).toBe(false);
  });

  it("parses JSON body when within limit", async () => {
    const req = createRequest("POST", '{"ok":true}');
    await expect(readJsonBodyWithLimit(req, 32)).resolves.toEqual({ ok: true });
  });

  it("returns undefined for non-POST requests", async () => {
    const req = createRequest("GET", '{"ignored":true}');
    await expect(readJsonBodyWithLimit(req, 32)).resolves.toBeUndefined();
  });

  it("throws payload error when body exceeds limit", async () => {
    const req = createRequest("POST", '{"x":"1234567890"}');

    await expect(readJsonBodyWithLimit(req, 8)).rejects.toBeInstanceOf(
      PayloadTooLargeError,
    );
  });

  it("throws syntax error on malformed JSON", async () => {
    const req = createRequest("POST", "{bad json");
    await expect(readJsonBodyWithLimit(req, 1024)).rejects.toBeInstanceOf(
      SyntaxError,
    );
  });
});
