import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCsrfToken, addCsrfHeader } from "@/lib/csrf";

describe("CSRF Utils", () => {
  beforeEach(() => {
    document.cookie = "";
  });

  afterEach(() => {
    document.cookie = "";
  });

  it("should return null when no CSRF token cookie exists", () => {
    const token = getCsrfToken();
    expect(token).toBeNull();
  });

  it("should extract CSRF token from cookie", () => {
    document.cookie = "csrf-token=test-token-123";
    const token = getCsrfToken();
    expect(token).toBe("test-token-123");
  });

  it("should handle multiple cookies", () => {
    document.cookie = "other=value; csrf-token=my-token; another=cookie";
    const token = getCsrfToken();
    expect(token).toBe("my-token");
  });

  it("should add CSRF header when token exists", () => {
    document.cookie = "csrf-token=test-token";
    const headers = addCsrfHeader({ "Content-Type": "application/json" });
    
    expect(headers).toHaveProperty("X-CSRF-Token", "test-token");
    expect(headers).toHaveProperty("Content-Type", "application/json");
  });

  it("should not add CSRF header when token is missing", () => {
    const headers = addCsrfHeader({ "Content-Type": "application/json" });
    
    expect(headers).not.toHaveProperty("X-CSRF-Token");
    expect(headers).toHaveProperty("Content-Type", "application/json");
  });
});

