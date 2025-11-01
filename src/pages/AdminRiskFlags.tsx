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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskFlag {
  id: string;
  entity_type: string;
  entity_id: string;
  flag_type: string;
  severity: string;
  description: string | null;
  auto_generated: boolean;
  metadata: any;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export default function AdminRiskFlags() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isComplianceOfficer, loading: roleLoading } = useUserRole(user?.id);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<RiskFlag | null>(null);
  const [resolvingFlag, setResolvingFlag] = useState<RiskFlag | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [formData, setFormData] = useState({
    entity_type: "remittance",
    entity_id: "",
    flag_type: "velocity_check",
    severity: "medium",
    description: "",
    auto_generated: false
  });

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
      fetchFlags();
    }
  }, [user, isAdmin, isComplianceOfficer]);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("risk_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlags((data || []).map(flag => ({ 
        ...flag, 
        auto_generated: flag.auto_generated ?? false,
        resolved: flag.resolved ?? false
      })));
    } catch (error) {
      console.error("Error fetching risk flags:", error);
      toast.error("Error al cargar banderas de riesgo");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (flag?: RiskFlag) => {
    if (flag) {
      setEditingFlag(flag);
      setFormData({
        entity_type: flag.entity_type,
        entity_id: flag.entity_id,
        flag_type: flag.flag_type,
        severity: flag.severity,
        description: flag.description || "",
        auto_generated: flag.auto_generated
      });
    } else {
      setEditingFlag(null);
      setFormData({
        entity_type: "remittance",
        entity_id: "",
        flag_type: "velocity_check",
        severity: "medium",
        description: "",
        auto_generated: false
      });
    }
    setDialogOpen(true);
  };

  const handleSaveFlag = async () => {
    try {
      const flagData = {
        entity_type: formData.entity_type,
        entity_id: formData.entity_id,
        flag_type: formData.flag_type,
        severity: formData.severity,
        description: formData.description || null,
        auto_generated: formData.auto_generated
      };

      if (editingFlag) {
        const { error } = await supabase
          .from("risk_flags")
          .update(flagData)
          .eq("id", editingFlag.id);
        
        if (error) throw error;
        toast.success("Bandera actualizada");
      } else {
        const { error } = await supabase
          .from("risk_flags")
          .insert([flagData]);
        
        if (error) throw error;
        toast.success("Bandera creada");
      }

      setDialogOpen(false);
      fetchFlags();
    } catch (error) {
      console.error("Error saving flag:", error);
      toast.error("Error al guardar bandera");
    }
  };

  const handleOpenResolveDialog = (flag: RiskFlag) => {
    setResolvingFlag(flag);
    setResolutionNotes(flag.resolution_notes || "");
    setResolveDialogOpen(true);
  };

  const handleResolveFlag = async () => {
    if (!resolvingFlag) return;

    try {
      const { error } = await supabase
        .from("risk_flags")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: resolutionNotes
        })
        .eq("id", resolvingFlag.id);

      if (error) throw error;
      toast.success("Bandera resuelta");
      setResolveDialogOpen(false);
      fetchFlags();
    } catch (error) {
      console.error("Error resolving flag:", error);
      toast.error("Error al resolver bandera");
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
              <h1 className="text-3xl font-bold">Banderas de Riesgo</h1>
              <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Acceso restringido a administradores</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Bandera
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Banderas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{flags.filter(f => !f.resolved).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alta Severidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">
                {flags.filter(f => !f.resolved && f.severity === "high").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resueltas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{flags.filter(f => f.resolved).length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas las Banderas</CardTitle>
          </CardHeader>
          <CardContent>
            {flags.length === 0 ? (
              <p className="text-muted-foreground">No hay banderas de riesgo</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo Entidad</TableHead>
                    <TableHead>Tipo Bandera</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>{flag.entity_type}</TableCell>
                      <TableCell>{flag.flag_type}</TableCell>
                      <TableCell>
                        <Badge variant={
                          flag.severity === "high" ? "destructive" :
                          flag.severity === "medium" ? "default" : "secondary"
                        }>
                          {flag.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{flag.description}</TableCell>
                      <TableCell>{new Date(flag.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={flag.resolved ? "outline" : "default"}>
                          {flag.resolved ? "Resuelta" : "Activa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(flag)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!flag.resolved && (
                            <Button size="sm" variant="default" onClick={() => handleOpenResolveDialog(flag)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFlag ? "Editar Bandera" : "Nueva Bandera"}</DialogTitle>
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
                      <SelectItem value="remittance">Remesa</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ID de Entidad</Label>
                  <Input
                    value={formData.entity_id}
                    onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                    placeholder="UUID de la entidad"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Bandera</Label>
                  <Input
                    value={formData.flag_type}
                    onChange={(e) => setFormData({ ...formData, flag_type: e.target.value })}
                    placeholder="velocity_check, duplicate_tx"
                  />
                </div>
                <div>
                  <Label>Severidad</Label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del riesgo detectado"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_generated"
                  checked={formData.auto_generated}
                  onChange={(e) => setFormData({ ...formData, auto_generated: e.target.checked })}
                />
                <Label htmlFor="auto_generated">Auto-generada</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveFlag}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver Bandera de Riesgo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Notas de Resolución</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explica cómo se resolvió este riesgo"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleResolveFlag}>Marcar como Resuelta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
