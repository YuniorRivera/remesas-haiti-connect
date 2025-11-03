import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Store, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Agent {
  id: string;
  legal_name: string;
  trade_name?: string;
  code?: string;
  float_balance_dop?: number;
  daily_limit_dop?: number;
  is_active?: boolean;
  created_at: string;
}

const Stores = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    legal_name: "",
    trade_name: "",
    code: "",
    daily_limit_dop: "",
    float_balance_dop: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
      toast.error("Acceso denegado. Solo administradores.");
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAgents();
    }
  }, [user, isAdmin]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgents((data || []) as any);
    } catch (error: any) {
      toast.error("Error al cargar tiendas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        legal_name: agent.legal_name,
        trade_name: agent.trade_name || "",
        code: agent.code || "",
        daily_limit_dop: agent.daily_limit_dop?.toString() || "",
        float_balance_dop: agent.float_balance_dop?.toString() || "",
      });
    } else {
      setEditingAgent(null);
      setFormData({
        legal_name: "",
        trade_name: "",
        code: "",
        daily_limit_dop: "50000",
        float_balance_dop: "0",
      });
    }
    setDialogOpen(true);
  };

  const handleSaveAgent = async () => {
    try {
      if (!formData.legal_name) {
        toast.error("Nombre legal es requerido");
        return;
      }

      const payload = {
        legal_name: formData.legal_name.trim(),
        trade_name: formData.trade_name.trim() || null,
        code: formData.code.trim() || null,
        daily_limit_dop: parseFloat(formData.daily_limit_dop) || 50000,
        float_balance_dop: parseFloat(formData.float_balance_dop) || 0,
        is_active: true,
        // Campos legacy requeridos por la base de datos
        trade_name_old: formData.trade_name.trim() || formData.legal_name.trim(),
        address_old: "Pendiente",
      };

      if (editingAgent) {
        const { error } = await supabase
          .from("agents")
          .update(payload)
          .eq("id", editingAgent.id);

        if (error) throw error;
        toast.success("Tienda actualizada");
      } else {
        const { error } = await supabase
          .from("agents")
          .insert([payload]);

        if (error) throw error;
        toast.success("Tienda creada");
      }

      setDialogOpen(false);
      fetchAgents();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar tienda");
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from("agents")
        .update({ is_active: !agent.is_active })
        .eq("id", agent.id);

      if (error) throw error;
      toast.success(agent.is_active ? "Tienda desactivada" : "Tienda activada");
      fetchAgents();
    } catch (error: any) {
      toast.error("Error al cambiar estado");
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")} 
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Gestión de Tiendas
              </h1>
              <p className="text-sm text-muted-foreground">
                Administra agentes y puntos de venta
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tienda
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Tiendas Registradas ({agents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay tiendas registradas. Crea una nueva para empezar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Legal</TableHead>
                    <TableHead>Nombre Comercial</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Float Disponible</TableHead>
                    <TableHead className="text-right">Límite Diario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.legal_name}</TableCell>
                      <TableCell>{agent.trade_name || "-"}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {agent.code || "-"}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3" />
                          {(agent.float_balance_dop || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {(agent.daily_limit_dop || 0).toLocaleString('es-DO')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={agent.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(agent)}
                        >
                          {agent.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(agent)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAgent ? "Editar Tienda" : "Nueva Tienda"}
            </DialogTitle>
            <DialogDescription>
              {editingAgent 
                ? "Actualiza los datos de la tienda" 
                : "Ingresa los datos para registrar una nueva tienda"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="legal_name">Nombre Legal *</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="Empresa ABC, SRL"
              />
            </div>
            <div>
              <Label htmlFor="trade_name">Nombre Comercial</Label>
              <Input
                id="trade_name"
                value={formData.trade_name}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                placeholder="Colmado ABC"
              />
            </div>
            <div>
              <Label htmlFor="code">Código de Tienda</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ABC-001"
              />
            </div>
            <div>
              <Label htmlFor="daily_limit_dop">Límite Diario (DOP)</Label>
              <Input
                id="daily_limit_dop"
                type="number"
                step="1000"
                value={formData.daily_limit_dop}
                onChange={(e) => setFormData({ ...formData, daily_limit_dop: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div>
              <Label htmlFor="float_balance_dop">Float Inicial (DOP)</Label>
              <Input
                id="float_balance_dop"
                type="number"
                step="100"
                value={formData.float_balance_dop}
                onChange={(e) => setFormData({ ...formData, float_balance_dop: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAgent}>
              {editingAgent ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stores;
