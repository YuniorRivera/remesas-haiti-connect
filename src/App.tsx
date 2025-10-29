import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { LiteModeProvider } from "@/contexts/LiteModeContext";
import { CookieBanner } from "./components/CookieBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLinks } from "@/components/SkipLink";
import { LoadingFallback } from "@/components/ui/loading";
// Critical above-the-fold pages (no lazy loading for LCP)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import OnboardingSender from "./pages/OnboardingSender";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

// Lazy load heavy components for better code splitting
const RemittanceDetail = lazy(() => import("./pages/RemittanceDetail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const CreateRemittance = lazy(() => import("./pages/CreateRemittance"));
const AdminOperations = lazy(() => import("./pages/AdminOperations"));
const AdminReconciliation = lazy(() => import("./pages/AdminReconciliation"));
const AdminCompliance = lazy(() => import("./pages/AdminCompliance"));
const AdminMargins = lazy(() => import("./pages/AdminMargins"));
const AdminFees = lazy(() => import("./pages/AdminFees"));
const AdminLimits = lazy(() => import("./pages/AdminLimits"));
const AdminRiskFlags = lazy(() => import("./pages/AdminRiskFlags"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminLedger = lazy(() => import("./pages/AdminLedger"));
const Stores = lazy(() => import("./pages/Stores"));
const AgentEarnings = lazy(() => import("./pages/AgentEarnings"));
const SenderSend = lazy(() => import("./pages/SenderSend"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <LiteModeProvider>
          <TooltipProvider>
            <BrowserRouter>
              <SkipLinks />
              <Toaster />
              <Sonner />
              <CookieBanner />
              <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/onboarding" element={
            <ProtectedRoute requireAuth>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/onboarding/sender" element={
            <ProtectedRoute requireAuth>
              <OnboardingSender />
            </ProtectedRoute>
          } />
            
            {/* Authenticated routes (any role) */}
            <Route path="/dashboard" element={
              <ProtectedRoute requireAuth>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute requireAuth>
                <Suspense fallback={<LoadingFallback />}>
                  <Transactions />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/transactions/:id" element={
              <ProtectedRoute requireAuth>
                <Suspense fallback={<LoadingFallback />}>
                  <RemittanceDetail />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/send" element={
              <ProtectedRoute requireAuth>
                <Suspense fallback={<LoadingFallback />}>
                  <SenderSend />
                </Suspense>
              </ProtectedRoute>
            } />
            
            {/* Agent routes */}
            <Route path="/agent-dashboard" element={
              <ProtectedRoute requireAuth allowedRoles={['agent_owner', 'agent_clerk']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AgentDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/remittances/create" element={
              <ProtectedRoute requireAuth allowedRoles={['agent_owner', 'agent_clerk']}>
                <Suspense fallback={<LoadingFallback />}>
                  <CreateRemittance />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/agent-earnings" element={
              <ProtectedRoute requireAuth allowedRoles={['agent_owner', 'agent_clerk']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AgentEarnings />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/stores" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <Stores />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-operations" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminOperations />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-reconciliation" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminReconciliation />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-margins" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminMargins />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-fees" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminFees />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-limits" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminLimits />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-audit-log" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminAuditLog />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-ledger" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminLedger />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Admin + Compliance routes */}
            <Route path="/admin-risk-flags" element={
              <ProtectedRoute requireAuth allowedRoles={['admin', 'compliance_officer']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminRiskFlags />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin-compliance" element={
              <ProtectedRoute requireAuth allowedRoles={['admin', 'compliance_officer']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminCompliance />
                </Suspense>
              </ProtectedRoute>
            } />
            
            {/* 404 - Must be last */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LiteModeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
