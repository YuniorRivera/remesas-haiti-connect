import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, MapPin, Phone, DollarSign } from "lucide-react";
import { toast } from "sonner";

const Stores = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
      toast.error("Acceso denegado");
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStores();
    }
  }, [user, isAdmin]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('dashboard')}
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">{t('agentManagement')}</h1>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Tienda
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{store.trade_name || store.legal_name}</CardTitle>
                  <Badge variant={store.is_active ? "default" : "secondary"}>
                    {store.is_active ? t('active') : t('inactive')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{store.address}</span>
                </div>
                {store.rnc && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>RNC: {store.rnc}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg bg-secondary/20 p-3">
                  <DollarSign className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('availableFloat')}</p>
                    <p className="text-lg font-bold text-secondary">
                      ${parseFloat(store.float_balance_dop || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">{t('noData')}</p>
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Crear Primera Tienda
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Stores;
