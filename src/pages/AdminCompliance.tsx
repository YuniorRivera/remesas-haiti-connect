import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, Clock, User, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminCompliance() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isComplianceOfficer, loading: roleLoading } = useUserRole(user?.id);
  const [stats, setStats] = useState({
    pending: 0,
    alerts: 0,
    completed: 0,
  });
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [kybDocs, setKybDocs] = useState<any[]>([]);
  const [riskFlags, setRiskFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin && !isComplianceOfficer) {
      navigate("/dashboard");
    }
  }, [isAdmin, isComplianceOfficer, roleLoading, navigate]);

  useEffect(() => {
    if (user && (isAdmin || isComplianceOfficer)) {
      fetchComplianceData();
    }
  }, [user, isAdmin, isComplianceOfficer]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      
      // KYC documents pendientes
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*, profiles(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (kycError) {
        console.error('Error fetching KYC:', kycError);
        toast.error('Error al cargar documentos KYC');
      }

      // KYB documents pendientes
      const { data: kybData, error: kybError } = await supabase
        .from('kyb_documents')
        .select('*, agents(trade_name, legal_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (kybError) {
        console.error('Error fetching KYB:', kybError);
        toast.error('Error al cargar documentos KYB');
      }

      // Risk flags activos
      const { data: flagsData, error: flagsError } = await supabase
        .from('risk_flags')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (flagsError) {
        console.error('Error fetching flags:', flagsError);
        toast.error('Error al cargar risk flags');
      }

      // KYC/KYB completados (últimos 30 días)
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { data: completedKyc } = await supabase
        .from('kyc_documents')
        .select('id')
        .eq('status', 'approved')
        .gte('reviewed_at', monthAgo.toISOString());

      const { data: completedKyb } = await supabase
        .from('kyb_documents')
        .select('id')
        .eq('status', 'approved')
        .gte('reviewed_at', monthAgo.toISOString());

      const totalPending = (kycData?.length || 0) + (kybData?.length || 0);
      const totalCompleted = (completedKyc?.length || 0) + (completedKyb?.length || 0);

      setStats({
        pending: totalPending,
        alerts: flagsData?.length || 0,
        completed: totalCompleted,
      });

      setKycDocs(kycData || []);
      setKybDocs(kybData || []);
      setRiskFlags(flagsData || []);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast.error('Error inesperado al cargar datos de compliance. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const approveDocument = async (type: 'kyc' | 'kyb', docId: string) => {
    try {
      const table = type === 'kyc' ? 'kyc_documents' : 'kyb_documents';
      const { error } = await supabase
        .from(table)
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (error) {
        console.error('Error approving document:', error);
        toast.error(`Error al aprobar documento: ${error.message}`);
        return;
      }
      
      toast.success('Documento aprobado exitosamente');
      fetchComplianceData();
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Error inesperado al aprobar documento. Intenta de nuevo.');
    }
  };

  const rejectDocument = async (type: 'kyc' | 'kyb', docId: string) => {
    try {
      const table = type === 'kyc' ? 'kyc_documents' : 'kyb_documents';
      const { error } = await supabase
        .from(table)
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (error) {
        console.error('Error rejecting document:', error);
        toast.error(`Error al rechazar documento: ${error.message}`);
        return;
      }
      
      toast.success('Documento rechazado');
      fetchComplianceData();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Error inesperado al rechazar documento. Intenta de nuevo.');
    }
  };

  if (authLoading || roleLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Compliance y KYC/KYB</h1>
            <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Acceso restringido a administradores y oficiales de compliance</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revisiones Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground mt-1">Documentos por revisar</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{stats.alerts}</p>
              <p className="text-xs text-muted-foreground mt-1">Risk flags sin resolver</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completados (Mes)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-muted-foreground mt-1">Aprobados últimos 30 días</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kyc" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="kyc">KYC ({kycDocs.length})</TabsTrigger>
            <TabsTrigger value="kyb">KYB ({kybDocs.length})</TabsTrigger>
            <TabsTrigger value="alerts">Alertas ({riskFlags.length})</TabsTrigger>
          </TabsList>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Documentos KYC Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kycDocs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay documentos KYC pendientes</p>
                ) : (
                  <div className="space-y-4">
                    {kycDocs.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{doc.profiles?.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {doc.doc_type} • {doc.doc_number}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: es })}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                            Pendiente
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => approveDocument('kyc', doc.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => rejectDocument('kyc', doc.id)}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYB Tab */}
          <TabsContent value="kyb">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Documentos KYB Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kybDocs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay documentos KYB pendientes</p>
                ) : (
                  <div className="space-y-4">
                    {kybDocs.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">
                              {doc.agents?.trade_name || doc.agents?.legal_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {doc.doc_type}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: es })}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                            Pendiente
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => approveDocument('kyb', doc.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => rejectDocument('kyb', doc.id)}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alertas Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Flags Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskFlags.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay alertas activas</p>
                ) : (
                  <div className="space-y-4">
                    {riskFlags.map((flag) => (
                      <div key={flag.id} className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold">{flag.flag_type}</div>
                          <Badge variant="destructive">{flag.severity}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {flag.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true, locale: es })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
