import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "../App";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe("Smoke Tests", () => {
  it("should render App without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it("should have root element", () => {
    const root = document.getElementById("root");
    expect(root).toBeTruthy();
  });
});

