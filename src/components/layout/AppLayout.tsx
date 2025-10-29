import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Store,
  Send,
  History,
  TrendingUp,
  FileText,
  ShieldCheck,
  BarChart3,
  DollarSign,
  LogOut,
  Home,
  AlertTriangle,
  Scale,
  ScrollText,
  BookOpen,
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole(user?.id);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Menu items for Tienda (Agent)
  const agentMenuItems = [
    { title: "Dashboard", url: "/agent-dashboard", icon: Home },
    { title: "Crear Envío", url: "/remittances/create", icon: Send },
    { title: "Historial", url: "/transactions", icon: History },
    { title: "Ganancias", url: "/agent-earnings", icon: TrendingUp },
  ];

  // Menu items for Admin
  const adminMenuItems = [
    { title: "Dashboard", url: "/admin-dashboard", icon: Home },
    { title: "Operaciones", url: "/admin-operations", icon: Store },
    { title: "Tiendas", url: "/stores", icon: Store },
    { title: "Conciliación", url: "/admin-reconciliation", icon: FileText },
    { title: "Compliance/KYC", url: "/admin-compliance", icon: ShieldCheck },
    { title: "Márgenes", url: "/admin-margins", icon: BarChart3 },
    { title: "Tarifas", url: "/admin-fees", icon: DollarSign },
    { title: "Límites", url: "/admin-limits", icon: Scale },
    { title: "Risk Flags", url: "/admin-risk-flags", icon: AlertTriangle },
    { title: "Audit Log", url: "/admin-audit-log", icon: ScrollText },
    { title: "Ledger", url: "/admin-ledger", icon: BookOpen },
  ];

  // Menu items for Emisor (Sender)
  const senderMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Enviar Dinero", url: "/send", icon: Send },
    { title: "Mis Envíos", url: "/transactions", icon: History },
  ];

  // Determine which menu to show based on role
  const getMenuItems = () => {
    if (isAdmin) return adminMenuItems;
    if (isAgent) return agentMenuItems;
    return senderMenuItems;
  };

  const menuItems = getMenuItems();

  if (roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <span className="font-semibold">RemitApp</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                {isAdmin ? "Admin" : isAgent ? "Tienda" : "Emisor"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a
                          href={item.url}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(item.url);
                          }}
                          className="flex items-center gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Legal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a
                        href="/legal"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/legal");
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Privacidad y Términos</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground truncate">
                {user?.email}
              </div>
              <div className="flex gap-2">
                <LanguageSelector />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex-1"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
