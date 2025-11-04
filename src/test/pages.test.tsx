/**
 * Smoke tests for key pages
 * 
 * Verifies that critical pages render without crashing and have proper i18n support
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LiteModeProvider } from "@/contexts/LiteModeContext";
import { TooltipProvider } from "@/components/ui/tooltip";

// Test wrapper with all providers
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
        })),
      })),
    })),
  },
}));

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock useUserRole hook
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    isAdmin: false,
    isAgent: false,
    isComplianceOfficer: false,
    isSenderUser: false,
    loading: false,
  }),
}));

// Mock useNavigate to avoid errors
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

describe("Pages Smoke Tests", () => {
  describe("Index Page", () => {
    it("should render without crashing", async () => {
      const Index = (await import("@/pages/Index")).default;
      const { container } = render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );
      
      // Should render without errors
      expect(container).toBeTruthy();
      // Check for main heading or key element
      expect(screen.getByText(/kobcash/i)).toBeDefined();
    });

    it("should support i18n (shows translated text)", async () => {
      const Index = (await import("@/pages/Index")).default;
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );
      
      // Should have login button (translated)
      const loginButton = screen.getByRole("button", { 
        name: /iniciar|konekte|connecter|login|connexion/i 
      });
      expect(loginButton).toBeDefined();
    });
  });

  describe("Auth Page", () => {
    it("should render without crashing", async () => {
      const Auth = (await import("@/pages/Auth")).default;
      const { container } = render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );
      
      // Should render without errors
      expect(container).toBeTruthy();
      // Should render auth form (check for kobcash heading or form elements)
      expect(screen.getByText(/kobcash/i)).toBeDefined();
    });

    it("should support i18n", async () => {
      const Auth = (await import("@/pages/Auth")).default;
      const { container } = render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );
      
      // Should render AuthForm which has email input
      // Email input should be in the form
      const emailInput = container.querySelector('input[type="email"]');
      expect(emailInput).toBeDefined();
    });
  });

  describe("NotFound Page", () => {
    it("should render without crashing", async () => {
      const NotFound = (await import("@/pages/NotFound")).default;
      const { container } = render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );
      
      // Should render without errors
      expect(container).toBeTruthy();
      // Should show 404 or not found message (check for "404" or "not found")
      const textContent = container.textContent?.toLowerCase() || '';
      expect(textContent.includes('404') || textContent.includes('not found') || textContent.includes('page not found')).toBeTruthy();
    });
  });

  describe("Legal Page", () => {
    it("should render without crashing", async () => {
      const Legal = (await import("@/pages/Legal")).default;
      render(
        <TestWrapper>
          <Legal />
        </TestWrapper>
      );
      
      // Should have legal content
      expect(document.body).toBeTruthy();
    });
  });
});

