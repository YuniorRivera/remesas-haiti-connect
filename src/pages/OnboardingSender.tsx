import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { User } from "lucide-react";

const senderFormSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  phone: z.string().trim().min(10, "El teléfono debe tener al menos 10 dígitos").max(20, "El teléfono es muy largo"),
  direccion: z.string().trim().max(200, "La dirección es muy larga").optional().or(z.literal("")),
  documento_identidad: z.string().trim().max(50, "El documento es muy largo").optional().or(z.literal("")),
  tipo_documento: z.string().optional().or(z.literal(""))
});

type SenderFormData = z.infer<typeof senderFormSchema>;

const OnboardingSender = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SenderFormData>({
    full_name: "",
    phone: "",
    direccion: "",
    documento_identidad: "",
    tipo_documento: ""
  });

  // Simple auth check - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const validatedData = senderFormSchema.parse(formData);
      setLoading(true);

      // 1. Guardar/actualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: validatedData.full_name,
          phone: validatedData.phone || null,
          direccion: validatedData.direccion || null,
          documento_identidad: validatedData.documento_identidad || null,
          tipo_documento: validatedData.tipo_documento || null
        }, { 
          onConflict: 'id' 
        });

      if (profileError) throw profileError;

      // 2. Asignar rol sender_user
      const { data: roleResult, error: roleError } = await supabase.rpc("assign_sender_user");
      
      console.log("🔷 OnboardingSender: assign_sender_user result:", roleResult);
      
      if (roleError) throw roleError;

      toast.success("¡Perfil configurado exitosamente!");
      // Force full page reload to ensure role is updated
      window.location.href = "/welcome";
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        toast.error(firstError.message);
      } else {
        const err = error as { message?: string };
        toast.error("Error al guardar el perfil: " + (err.message || "desconocido"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-2xl py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">Registro de Usuario Final</CardTitle>
            <CardDescription className="text-base">
              Completa tu información para comenzar a enviar remesas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="809-XXX-XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección (opcional)</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Tu dirección completa"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo_documento">Tipo de Documento (opcional)</Label>
                  <Select
                    value={formData.tipo_documento}
                    onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
                  >
                    <SelectTrigger id="tipo_documento">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cedula">Cédula</SelectItem>
                      <SelectItem value="pasaporte">Pasaporte</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documento_identidad">Número de Documento (opcional)</Label>
                  <Input
                    id="documento_identidad"
                    value={formData.documento_identidad}
                    onChange={(e) => setFormData({ ...formData, documento_identidad: e.target.value })}
                    placeholder="XXX-XXXXXXX-X"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? "Guardando..." : "Guardar y Continuar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/onboarding")}
                  disabled={loading}
                  className="w-full"
                >
                  Volver
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingSender;
