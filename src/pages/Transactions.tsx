import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Transactions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isComplianceOfficer } = useUserRole(user?.id);
  const { t } = useLocale();
  const [transactions, setTransactions] = useState([]);
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
      setTransactions(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <LoadingOverlay isLoading={loading}>
        <div className="min-h-screen bg-muted/30">
          <PageHeader
            title={t('myTransactions')}
            backUrl="/dashboard"
            backLabel={t('dashboard')}
          />

          <main className="container mx-auto p-6">
            <TransactionsTable transactions={transactions} showPlatformMargin={showPlatformMargin} />
          </main>
        </div>
      </LoadingOverlay>
    </AppLayout>
  );
};

export default Transactions;
