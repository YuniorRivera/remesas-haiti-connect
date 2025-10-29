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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import OnboardingSender from "./pages/OnboardingSender";
import AgentDashboard from "./pages/AgentDashboard";
import CreateRemittance from "./pages/CreateRemittance";
import Transactions from "./pages/Transactions";
import Stores from "./pages/Stores";
import AgentEarnings from "./pages/AgentEarnings";
import SenderSend from "./pages/SenderSend";
import AdminOperations from "./pages/AdminOperations";
import AdminReconciliation from "./pages/AdminReconciliation";
import AdminCompliance from "./pages/AdminCompliance";
import AdminMargins from "./pages/AdminMargins";
import AdminFees from "./pages/AdminFees";
import AdminLimits from "./pages/AdminLimits";
import AdminRiskFlags from "./pages/AdminRiskFlags";
import AdminAuditLog from "./pages/AdminAuditLog";
import AdminLedger from "./pages/AdminLedger";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

// Lazy load heavy components (PDF generation, Admin dashboard)
const RemittanceDetail = lazy(() => import("./pages/RemittanceDetail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <LiteModeProvider>
      <TooltipProvider>
        <BrowserRouter>
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
                <Transactions />
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
                <SenderSend />
              </ProtectedRoute>
            } />
            
            {/* Agent routes */}
            <Route path="/agent-dashboard" element={
              <ProtectedRoute requireAuth allowedRoles={['agent_owner', 'agent_clerk']}>
                <AgentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/remittances/create" element={
              <ProtectedRoute requireAuth allowedRoles={['agent_owner', 'agent_clerk']}>
                <CreateRemittance />
              </ProtectedRoute>
            } />
            <Route path="/agent-earnings" element={
              <ProtectedRoute requireAuth allowedRoles={['agent_owner', 'agent_clerk']}>
                <AgentEarnings />
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
                <Stores />
              </ProtectedRoute>
            } />
            <Route path="/admin-operations" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <AdminOperations />
              </ProtectedRoute>
            } />
            <Route path="/admin-reconciliation" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <AdminReconciliation />
              </ProtectedRoute>
            } />
            <Route path="/admin-margins" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <AdminMargins />
              </ProtectedRoute>
            } />
            <Route path="/admin-fees" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <AdminFees />
              </ProtectedRoute>
            } />
            <Route path="/admin-limits" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <AdminLimits />
              </ProtectedRoute>
            } />
            <Route path="/admin-audit-log" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <AdminAuditLog />
              </ProtectedRoute>
            } />
            <Route path="/admin-ledger" element={
              <ProtectedRoute requireAuth allowedRoles={['admin']}>
                <AdminLedger />
              </ProtectedRoute>
            } />
            
            {/* Admin + Compliance routes */}
            <Route path="/admin-risk-flags" element={
              <ProtectedRoute requireAuth allowedRoles={['admin', 'compliance_officer']}>
                <AdminRiskFlags />
              </ProtectedRoute>
            } />
            <Route path="/admin-compliance" element={
              <ProtectedRoute requireAuth allowedRoles={['admin', 'compliance_officer']}>
                <AdminCompliance />
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
);

export default App;
