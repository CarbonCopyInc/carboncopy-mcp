import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_SUCCESS_RESPONSE: Record<string, unknown> = { success: true };

function toStructuredContent(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return { result: value };
}

export function jsonToolResult(data: unknown): CallToolResult {
  const payload = data ?? DEFAULT_SUCCESS_RESPONSE;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: toStructuredContent(payload),
  };
}
