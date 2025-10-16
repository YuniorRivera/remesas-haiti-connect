import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateRemittance from "./pages/CreateRemittance";
import Transactions from "./pages/Transactions";
import RemittanceDetail from "./pages/RemittanceDetail";
import Stores from "./pages/Stores";
import NotFound from "./pages/NotFound";
import { CookieBanner } from "./components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agent-dashboard" element={<AgentDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/remittances/create" element={<CreateRemittance />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<RemittanceDetail />} />
            <Route path="/stores" element={<Stores />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
