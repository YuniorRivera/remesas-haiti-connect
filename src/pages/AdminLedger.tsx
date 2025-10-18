import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  currency: string;
  agent_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface LedgerEntry {
  id: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  currency: string;
  memo: string | null;
  txn_id: string | null;
  entry_at: string;
  created_at: string;
}

export default function AdminLedger() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAccounts, setSearchAccounts] = useState("");
  const [searchEntries, setSearchEntries] = useState("");

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
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      const [accountsRes, entriesRes] = await Promise.all([
        supabase.from("ledger_accounts").select("*").order("code"),
        supabase.from("ledger_entries").select("*").order("entry_at", { ascending: false }).limit(500)
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setAccounts(accountsRes.data || []);
      setEntries(entriesRes.data || []);
    } catch (error) {
      console.error("Error fetching ledger data:", error);
      toast.error("Error al cargar datos del ledger");
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.code.toLowerCase().includes(searchAccounts.toLowerCase()) ||
    acc.name.toLowerCase().includes(searchAccounts.toLowerCase())
  );

  const filteredEntries = entries.filter(entry =>
    entry.memo?.toLowerCase().includes(searchEntries.toLowerCase()) ||
    entry.txn_id?.toLowerCase().includes(searchEntries.toLowerCase())
  );

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId.substring(0, 8);
  };

  const totalBalance = entries.reduce((sum, entry) => {
    return sum + Number(entry.amount);
  }, 0);

  if (authLoading || roleLoading || loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">Contabilidad (Ledger)</h1>
            <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Acceso restringido a administradores</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Cuentas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{accounts.filter(a => a.is_active).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Entradas (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {entries.filter(e => new Date(e.entry_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Balance Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="entries">
          <TabsList className="mb-4">
            <TabsTrigger value="entries">Entradas Contables</TabsTrigger>
            <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            <Card>
              <CardHeader>
                <CardTitle>Entradas del Ledger</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por memo o transacción..."
                    value={searchEntries}
                    onChange={(e) => setSearchEntries(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredEntries.length === 0 ? (
                  <p className="text-muted-foreground">No hay entradas contables</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cuenta Débito</TableHead>
                        <TableHead>Cuenta Crédito</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Moneda</TableHead>
                        <TableHead>Memo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(entry.entry_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getAccountName(entry.debit_account)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getAccountName(entry.credit_account)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {entry.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.currency}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.memo || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Cuentas del Ledger</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código o nombre..."
                    value={searchAccounts}
                    onChange={(e) => setSearchAccounts(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredAccounts.length === 0 ? (
                  <p className="text-muted-foreground">No hay cuentas configuradas</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Moneda</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono">{account.code}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{account.currency}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={account.is_active ? "default" : "secondary"}>
                              {account.is_active ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(account.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
