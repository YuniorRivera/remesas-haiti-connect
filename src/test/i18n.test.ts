import { describe, it, expect } from "vitest";
import ht from "@/locales/ht.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";

describe("i18n Smoke Tests", () => {
  it("should have all locale dictionaries loaded", () => {
    expect(ht).toBeDefined();
    expect(es).toBeDefined();
    expect(fr).toBeDefined();
  });

  it("should have common keys in all languages", () => {
    const commonKeys = ["login", "logout", "dashboard", "loading", "welcome"];
    
    commonKeys.forEach((key) => {
      expect(ht[key as keyof typeof ht]).toBeTruthy();
      expect(es[key as keyof typeof es]).toBeTruthy();
      expect(fr[key as keyof typeof fr]).toBeTruthy();
    });
  });

  it("HT should be default (has all keys)", () => {
    expect(Object.keys(ht).length).toBeGreaterThan(0);
    expect(ht.login).toBe("Konekte");
    expect(ht.dashboard).toBe("Tablo Kontròl");
  });
});

