import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLocale } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Footer } from "@/components/Footer";
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
  const { t } = useLocale();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Menu items for Tienda (Agent)
  const agentMenuItems = [
    { title: t("dashboard"), url: "/agent-dashboard", icon: Home },
    { title: t("createShipment"), url: "/remittances/create", icon: Send },
    { title: t("history"), url: "/transactions", icon: History },
    { title: t("earnings"), url: "/agent-earnings", icon: TrendingUp },
  ];

  // Menu items for Admin
  const adminMenuItems = [
    { title: t("dashboard"), url: "/admin-dashboard", icon: Home },
    { title: t("operations"), url: "/admin-operations", icon: Store },
    { title: t("storeName"), url: "/stores", icon: Store },
    { title: t("reconciliation"), url: "/admin-reconciliation", icon: FileText },
    { title: t("complianceKYC"), url: "/admin-compliance", icon: ShieldCheck },
    { title: t("margins"), url: "/admin-margins", icon: BarChart3 },
    { title: t("feesConfig"), url: "/admin-fees", icon: DollarSign },
    { title: "Límites", url: "/admin-limits", icon: Scale }, // TODO: Add to dicts
    { title: "Risk Flags", url: "/admin-risk-flags", icon: AlertTriangle }, // TODO: Add to dicts
    { title: "Audit Log", url: "/admin-audit-log", icon: ScrollText }, // TODO: Add to dicts
    { title: "Ledger", url: "/admin-ledger", icon: BookOpen }, // TODO: Add to dicts
  ];

  // Menu items for Emisor (Sender)
  const senderMenuItems = [
    { title: t("dashboard"), url: "/dashboard", icon: Home },
    { title: "Enviar Dinero", url: "/send", icon: Send }, // TODO: Add to dicts
    { title: t("myTransactions"), url: "/transactions", icon: History },
  ];

  // Determine which menu to show based on role
  const getMenuItems = () => {
    if (isAdmin) return adminMenuItems;
    if (isAgent) return agentMenuItems;
    return senderMenuItems;
  };

  const menuItems = getMenuItems();

  if (roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">{t("loading")}</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r" id="main-navigation" role="navigation" aria-label="Navegación principal">
          <SidebarHeader className="border-b p-4">
            <SidebarMenuButton asChild>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
                className="flex items-center gap-2"
                aria-label="Volver a Inicio"
              >
                <Home className="h-6 w-6 text-primary" />
                <span className="font-semibold">RemitApp</span>
              </a>
            </SidebarMenuButton>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                {isAdmin ? t("admin") : isAgent ? t("agent") : t("sender")}
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
                          aria-label={item.title}
                        >
                          <item.icon className="h-4 w-4" aria-hidden="true" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t("legal")}</SidebarGroupLabel>
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
                        aria-label={`${t("privacy")} y ${t("termsConditions")}`}
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        <span>{t("privacy")} & {t("termsConditions")}</span>
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
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex-1"
                  aria-label={`${t("logout")} de la sesión`}
                >
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t("logout")}
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4" role="banner">
            <SidebarTrigger aria-label="Abrir o cerrar menú de navegación" />
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-auto" role="main" tabIndex={-1}>{children}</main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
