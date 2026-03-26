import { describe, expect, it } from "vitest";
import {
  createCarbonCopyMcpServer,
  SERVER_NAME,
  SERVER_VERSION,
} from "../server.js";

type ServerInternals = {
  _registeredTools: Record<string, unknown>;
  _registeredResources: Record<string, unknown>;
};

describe("createCarbonCopyMcpServer", () => {
  it("exports stable server metadata", () => {
    expect(SERVER_NAME).toBe("carboncopy");
    expect(SERVER_VERSION).toBe("0.1.0");
  });

  it("throws when CARBONCOPY_API_KEY is missing", () => {
    expect(() => createCarbonCopyMcpServer({})).toThrow(
      /CARBONCOPY_API_KEY environment variable is required/,
    );
  });

  it("registers all tools/resources on a shared server surface", () => {
    const { server } = createCarbonCopyMcpServer({
      CARBONCOPY_API_KEY: "cc_test_key",
    });

    const internals = server as unknown as ServerInternals;

    expect(Object.keys(internals._registeredTools).length).toBe(21);
    expect(internals._registeredTools).toHaveProperty("get_portfolio");
    expect(internals._registeredTools).toHaveProperty("health");

    expect(Object.keys(internals._registeredResources).sort()).toEqual([
      "carboncopy://portfolio",
      "carboncopy://traders",
    ]);
  });
});
