import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Store, ArrowLeft, LogOut } from "lucide-react";
import { logger } from "@/lib/logger";
import { z } from "zod";
const agentFormSchema = z.object({
  trade_name: z.string().min(3, "El nombre comercial debe tener al menos 3 caracteres"),
  legal_name: z.string().min(3, "La razón social debe tener al menos 3 caracteres"),
  rnc: z.string().min(9, "El RNC debe tener al menos 9 caracteres"),
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  address: z.string().min(10, "La dirección debe tener al menos 10 caracteres"),
  business_type: z.string().min(3, "El tipo de negocio es requerido")
});
type AgentFormData = z.infer<typeof agentFormSchema>;
const Onboarding = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut,
    loading: authLoading
  } = useAuth();
  const { isAdmin, isAgent, isComplianceOfficer, isSenderUser, loading: roleLoading } = useUserRole(user?.id);
  const [loading, setLoading] = useState(false);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [formData, setFormData] = useState<AgentFormData>({
    trade_name: "",
    legal_name: "",
    rnc: "",
    telefono: "",
    address: "",
    business_type: ""
  });
  type AssignResult = { ok: boolean; created?: boolean; reason?: string };
  const handleSenderUser = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1) Si ya tienes rol, navega directo
      const { data: existingRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!rolesError && (existingRoles?.some(r => r.role === "sender_user") || (existingRoles && existingRoles.length > 0))) {
        toast.success("Ya tienes tu perfil listo.");
        navigate("/dashboard");
        return;
      }

      // 2) Llama a la función segura para asignar primer rol
      const { data, error } = await supabase.rpc("assign_sender_user");

      if (error) {
        throw error;
      }

      const result = data as unknown as AssignResult;
      if (result?.ok) {
        toast.success(result.created ? "¡Perfil configurado exitosamente!" : "Ya tenías tu perfil listo.");
        navigate("/dashboard");
      } else {
        toast.error(result?.reason ? `No se pudo configurar el perfil: ${result.reason}` : "No se pudo configurar el perfil. Intenta nuevamente.");
      }
    } catch (error: any) {
      console.error("Error asignando rol:", error);
      toast.error("Error al configurar el perfil: " + (error?.message || "desconocido"));
    } finally {
      setLoading(false);
    }
  };
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const validatedData = agentFormSchema.parse(formData);
      setLoading(true);
      const {
        error
      } = await supabase.from("agents").insert([{
        owner_user_id: user.id,
        trade_name: validatedData.trade_name,
        trade_name_old: validatedData.trade_name,
        legal_name: validatedData.legal_name,
        rnc: validatedData.rnc,
        telefono: validatedData.telefono,
        address_old: validatedData.address,
        business_type: validatedData.business_type,
        kyb_status: "pending",
        is_active_old: false
      }]);
      if (error) throw error;
      toast.success("Solicitud enviada. Un administrador la revisará pronto.");
      setShowAgentForm(false);
      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues?.[0];
        toast.error(firstError?.message || "Error de validación");
      } else {
        console.error("Error creando solicitud de agente:", error);
        toast.error("Error al enviar solicitud: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  const hasAnyRole = isAdmin || isAgent || isComplianceOfficer || isSenderUser;
  
  // Show loading state while checking authentication
  if (authLoading || roleLoading) {
    console.log('🔵 Onboarding: Loading state', { authLoading, roleLoading });
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }
  
  console.log('🟢 Onboarding: Rendering content', { hasAnyRole, user: !!user });
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl py-16">
        <div className="mb-8">
          {hasAnyRole ? (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              onClick={async () => {
                console.log('🔴 Onboarding: Cerrar sesión clicked');
                await signOut();
                console.log('🔴 Onboarding: signOut complete, navigating');
                // Use window.location instead of navigate to force a full page reload
                window.location.href = '/';
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          )}
        </div>
        
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold text-primary">Bienvenidos a KòbCash Remesas RD-Haití</h1>
          <p className="text-lg text-muted-foreground">
            Selecciona el tipo de cuenta que deseas crear
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Usuario Final</CardTitle>
              <CardDescription className="text-base">
                Envío remesas para mí o mis familiares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li>✓ Envía dinero a Haití de forma rápida</li>
                <li>✓ Tasas competitivas y transparentes</li>
                <li>✓ Seguimiento en tiempo real</li>
                <li>✓ Comienza a usar de inmediato</li>
              </ul>
              <Button 
                onClick={() => {
                  logger.debug("🔷 Navigating to /onboarding/sender?force=1");
                  navigate('/onboarding/sender?force=1');
                }} 
                disabled={loading} 
                className="w-full" 
                size="lg"
              >
                Continuar como Usuario
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Store className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Agente / Tienda</CardTitle>
              <CardDescription className="text-base">
                Proceso remesas para mis clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li>✓ Panel de control completo</li>
                <li>✓ Gestión de transacciones</li>
                <li>✓ Comisiones por cada envío</li>
                <li>✓ Requiere aprobación administrativa</li>
              </ul>
              <Button onClick={() => setShowAgentForm(true)} disabled={loading} className="w-full" size="lg" variant="secondary">
                Registrar mi Tienda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAgentForm} onOpenChange={setShowAgentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registro de Agente / Tienda</DialogTitle>
            <DialogDescription>
              Completa la información de tu negocio. Un administrador revisará tu solicitud.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAgentSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trade_name">Nombre Comercial *</Label>
                <Input id="trade_name" value={formData.trade_name} onChange={e => setFormData({
                ...formData,
                trade_name: e.target.value
              })} placeholder="Ej: Remesas Express" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razón Social *</Label>
                <Input id="legal_name" value={formData.legal_name} onChange={e => setFormData({
                ...formData,
                legal_name: e.target.value
              })} placeholder="Nombre legal del negocio" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rnc">RNC *</Label>
                <Input id="rnc" value={formData.rnc} onChange={e => setFormData({
                ...formData,
                rnc: e.target.value
              })} placeholder="123-45678-9" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input id="telefono" value={formData.telefono} onChange={e => setFormData({
                ...formData,
                telefono: e.target.value
              })} placeholder="809-XXX-XXXX" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Tipo de Negocio *</Label>
              <Input id="business_type" value={formData.business_type} onChange={e => setFormData({
              ...formData,
              business_type: e.target.value
            })} placeholder="Ej: Casa de cambio, Tienda de conveniencia" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <Textarea id="address" value={formData.address} onChange={e => setFormData({
              ...formData,
              address: e.target.value
            })} placeholder="Dirección completa del establecimiento" required rows={3} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAgentForm(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Onboarding;