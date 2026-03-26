import { describe, expect, it } from "vitest";
import { jsonToolResult } from "../tools/response.js";

describe("jsonToolResult", () => {
  it("returns both text content and structuredContent", () => {
    const payload = { status: "ok", count: 2 };
    const result = jsonToolResult(payload);

    expect(result.structuredContent).toEqual(payload);
    expect(result.content).toHaveLength(1);
    const block = result.content?.[0];
    expect(block?.type).toBe("text");
    if (!block || block.type !== "text") {
      throw new Error("Expected text content block");
    }
    expect(JSON.parse(block.text)).toEqual(payload);
  });

  it("falls back to { success: true } for undefined values", () => {
    const result = jsonToolResult(undefined);

    expect(result.structuredContent).toEqual({ success: true });
    const block = result.content?.[0];
    expect(block?.type).toBe("text");
    if (!block || block.type !== "text") {
      throw new Error("Expected text content block");
    }
    expect(JSON.parse(block.text)).toEqual({ success: true });
  });

  it("wraps array payloads in structuredContent.result", () => {
    const payload = [{ id: 1 }];
    const result = jsonToolResult(payload);

    expect(result.structuredContent).toEqual({ result: payload });
  });
});
