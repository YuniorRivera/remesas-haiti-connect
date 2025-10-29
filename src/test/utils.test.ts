import { describe, it, expect } from "vitest";
import { logger } from "@/lib/logger";

describe("Utils Smoke Tests", () => {
  it("logger should have all methods", () => {
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("logger should execute without errors", () => {
    expect(() => {
      logger.debug("test");
      logger.info("test");
      logger.warn("test");
      logger.error("test");
    }).not.toThrow();
  });
});

