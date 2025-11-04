import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCsrfToken, addCsrfHeader } from "@/lib/csrf";

describe("CSRF Utils", () => {
  const originalCookie = document.cookie;

  beforeEach(() => {
    // Clear cookies by setting all to expire
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  afterEach(() => {
    // Restore original cookies if any
    document.cookie = originalCookie;
  });

  it("should return null when no CSRF token cookie exists", () => {
    const token = getCsrfToken();
    expect(token).toBeNull();
  });

  it("should extract CSRF token from cookie", () => {
    document.cookie = "csrf-token=test-token-123; path=/";
    const token = getCsrfToken();
    expect(token).toBe("test-token-123");
  });

  it("should handle multiple cookies", () => {
    // Set cookies separately as browser does
    document.cookie = "other=value; path=/";
    document.cookie = "csrf-token=my-token; path=/";
    document.cookie = "another=cookie; path=/";
    const token = getCsrfToken();
    expect(token).toBe("my-token");
  });

  it("should add CSRF header when token exists", () => {
    document.cookie = "csrf-token=test-token; path=/";
    const headers = addCsrfHeader({ "Content-Type": "application/json" });
    
    expect(headers).toHaveProperty("X-CSRF-Token", "test-token");
    expect(headers).toHaveProperty("Content-Type", "application/json");
  });

  it("should not add CSRF header when token is missing", () => {
    // Ensure no CSRF token exists
    document.cookie.split(";").forEach((c) => {
      if (c.includes("csrf-token")) {
        const name = c.split("=")[0]?.trim() ?? "";
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
    
    const headers = addCsrfHeader({ "Content-Type": "application/json" });
    
    expect(headers).not.toHaveProperty("X-CSRF-Token");
    expect(headers).toHaveProperty("Content-Type", "application/json");
  });
});

