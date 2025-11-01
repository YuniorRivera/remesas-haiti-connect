import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Limit {
  id: string;
  entity_type: string;
  entity_id: string | null;
  limit_type: string;
  amount_dop: number | null;
  count_limit: number | null;
  effective_from: string;
  effective_until: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminLimits() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [limits, setLimits] = useState<Limit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<Limit | null>(null);
  const [formData, setFormData] = useState({
    entity_type: "agent",
    entity_id: "",
    limit_type: "daily_transaction",
    amount_dop: "",
    count_limit: "",
    effective_from: new Date().toISOString().split('T')[0],
    effective_until: "",
    is_active: true
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchLimits();
    }
  }, [user, isAdmin]);

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .from("limits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLimits((data || []).map(limit => ({ ...limit, is_active: limit.is_active ?? false })));
    } catch (error) {
      console.error("Error fetching limits:", error);
      toast.error("Error al cargar límites");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (limit?: Limit) => {
    if (limit) {
      setEditingLimit(limit);
      setFormData({
        entity_type: limit.entity_type,
        entity_id: limit.entity_id || "",
        limit_type: limit.limit_type,
        amount_dop: limit.amount_dop?.toString() || "",
        count_limit: limit.count_limit?.toString() || "",
        effective_from: limit.effective_from.split('T')[0],
        effective_until: limit.effective_until?.split('T')[0] || "",
        is_active: limit.is_active
      });
    } else {
      setEditingLimit(null);
      setFormData({
        entity_type: "agent",
        entity_id: "",
        limit_type: "daily_transaction",
        amount_dop: "",
        count_limit: "",
        effective_from: new Date().toISOString().split('T')[0],
        effective_until: "",
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSaveLimit = async () => {
    try {
      const limitData = {
        entity_type: formData.entity_type,
        entity_id: formData.entity_id || null,
        limit_type: formData.limit_type,
        amount_dop: formData.amount_dop ? parseFloat(formData.amount_dop) : null,
        count_limit: formData.count_limit ? parseInt(formData.count_limit) : null,
        effective_from: formData.effective_from,
        effective_until: formData.effective_until || null,
        is_active: formData.is_active
      };

      if (editingLimit) {
        const { error } = await supabase
          .from("limits")
          .update(limitData)
          .eq("id", editingLimit.id);
        
        if (error) throw error;
        toast.success("Límite actualizado");
      } else {
        const { error } = await supabase
          .from("limits")
          .insert([limitData]);
        
        if (error) throw error;
        toast.success("Límite creado");
      }

      setDialogOpen(false);
      fetchLimits();
    } catch (error) {
      console.error("Error saving limit:", error);
      toast.error("Error al guardar límite");
    }
  };

  const handleDeleteLimit = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este límite?")) return;

    try {
      const { error } = await supabase
        .from("limits")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Límite eliminado");
      fetchLimits();
    } catch (error) {
      console.error("Error deleting limit:", error);
      toast.error("Error al eliminar límite");
    }
  };

  if (authLoading || roleLoading || loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">Gestión de Límites</h1>
              <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Acceso restringido a administradores</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Límite
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Límites Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            {limits.length === 0 ? (
              <p className="text-muted-foreground">No hay límites configurados</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo Entidad</TableHead>
                    <TableHead>Tipo Límite</TableHead>
                    <TableHead>Monto DOP</TableHead>
                    <TableHead>Cuenta Límite</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Hasta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limits.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell>{limit.entity_type}</TableCell>
                      <TableCell>{limit.limit_type}</TableCell>
                      <TableCell>{limit.amount_dop ? `$${limit.amount_dop.toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{limit.count_limit || "-"}</TableCell>
                      <TableCell>{new Date(limit.effective_from).toLocaleDateString()}</TableCell>
                      <TableCell>{limit.effective_until ? new Date(limit.effective_until).toLocaleDateString() : "Indefinido"}</TableCell>
                      <TableCell>
                        <Badge variant={limit.is_active ? "default" : "secondary"}>
                          {limit.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(limit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteLimit(limit.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLimit ? "Editar Límite" : "Nuevo Límite"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Entidad</Label>
                  <Select value={formData.entity_type} onValueChange={(value) => setFormData({ ...formData, entity_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="platform">Plataforma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ID de Entidad (opcional)</Label>
                  <Input
                    value={formData.entity_id}
                    onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                    placeholder="UUID de la entidad"
                  />
                </div>
              </div>
              <div>
                <Label>Tipo de Límite</Label>
                <Input
                  value={formData.limit_type}
                  onChange={(e) => setFormData({ ...formData, limit_type: e.target.value })}
                  placeholder="ej: daily_transaction, monthly_volume"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monto DOP</Label>
                  <Input
                    type="number"
                    value={formData.amount_dop}
                    onChange={(e) => setFormData({ ...formData, amount_dop: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Límite de Cuenta</Label>
                  <Input
                    type="number"
                    value={formData.count_limit}
                    onChange={(e) => setFormData({ ...formData, count_limit: e.target.value })}
                    placeholder="Número de transacciones"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Efectivo Desde</Label>
                  <Input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Efectivo Hasta (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.effective_until}
                    onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveLimit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
