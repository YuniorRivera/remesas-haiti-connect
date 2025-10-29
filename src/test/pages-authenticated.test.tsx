/**
 * Smoke tests for authenticated pages
 * 
 * Verifies that pages requiring authentication render properly
 * (with mocked auth hooks)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LiteModeProvider } from "@/contexts/LiteModeContext";
import { TooltipProvider } from "@/components/ui/tooltip";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <LiteModeProvider>
          <TooltipProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </TooltipProvider>
        </LiteModeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

// Mock authenticated user
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user", email: "test@example.com" },
    loading: false,
    signOut: vi.fn(),
  }),
}));

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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
          maybeSingle: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        maybeSingle: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  },
}));

// Mock useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useParams: () => ({}),
  };
});

// Mock useUserRole hook (needs to be outside describe block)
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    isAdmin: false,
    isAgent: false,
    isComplianceOfficer: false,
    isSenderUser: true,
    loading: false,
  }),
}));

describe("Authenticated Pages Smoke Tests", () => {
  describe("Dashboard Page", () => {
    it("should render without crashing", async () => {
      const Dashboard = (await import("@/pages/Dashboard")).default;
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
      
      // Dashboard should render (might show loading or content)
      expect(container).toBeTruthy();
    });
  });

  describe("Transactions Page", () => {
    it("should render without crashing", async () => {
      const Transactions = (await import("@/pages/Transactions")).default;
      const { container } = render(
        <TestWrapper>
          <Transactions />
        </TestWrapper>
      );
      
      // Should render transactions page structure
      expect(container).toBeTruthy();
    });
  });
});

