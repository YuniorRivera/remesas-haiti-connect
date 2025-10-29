import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import App from "../App";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ 
        data: { subscription: { unsubscribe: vi.fn() } },
        error: null 
      })),
    },
  },
}));

// Mock router to avoid navigation errors in tests
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("Smoke Tests", () => {
  beforeEach(() => {
    // Suppress console errors from React during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should render App without crashing", () => {
    expect(() => {
      const { container } = render(<App />);
      expect(container).toBeTruthy();
    }).not.toThrow();
  });
});

