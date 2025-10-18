import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  ip: string | null;
  details: any;
  created_at: string;
}

export default function AdminAuditLog() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      fetchLogs();
    }
  }, [user, isAdmin]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Error al cargar registro de auditoría");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return "default";
    if (action.includes("update") || action.includes("edit")) return "secondary";
    if (action.includes("delete") || action.includes("remove")) return "destructive";
    return "outline";
  };

  if (authLoading || roleLoading || loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">Registro de Auditoría</h1>
            <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Acceso restringido a administradores</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{logs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Eventos Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Únicos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Set(logs.map(l => l.actor_user_id).filter(Boolean)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Eventos de Auditoría</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por acción, entidad o IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground">No hay eventos registrados</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>ID Entidad</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadge(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_id ? log.entity_id.substring(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell>{log.ip || "-"}</TableCell>
                      <TableCell className="max-w-xs">
                        {log.details ? (
                          <pre className="text-xs overflow-auto max-h-20">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
