import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

const Transactions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isComplianceOfficer } = useUserRole(user?.id);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin and compliance can see platform margins
  const showPlatformMargin = isAdmin || isComplianceOfficer;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("remittances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as any);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
        <main className="container mx-auto p-6">
          <TransactionsTable transactions={transactions} showPlatformMargin={showPlatformMargin} />
        </main>
      </div>
    </AppLayout>
  );
};

export default Transactions;
