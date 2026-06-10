import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Target,
  BookOpen,
  CalendarDays,
  History,
  Settings,
  FileText,
  MessageSquareHeart,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePdis } from "@/hooks/api/usePdi";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function usePendingCount() {
  const { isGestor, isAdmin } = useAuth();
  const { data: pdis = [] } = usePdis();

  if (!isGestor && !isAdmin) return 0;

  return pdis
    .flatMap(p => p.tasks ?? [])
    .filter(t => t.status === 'submitted').length;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isAdmin, isGestor } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const pendingCount = usePendingCount();

  const navItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: t("dashboard"),
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { path: "/evaluations", icon: ClipboardList, label: t("evaluations") },
    { path: "/one-on-ones", icon: Users, label: "1:1" },
    { path: "/kpis", icon: Target, label: t("kpis") },
    { path: "/pdi", icon: BookOpen, label: t("pdi") },
    { path: "/content", icon: GraduationCap, label: "Conteudo" },
    { path: "/calendar", icon: CalendarDays, label: t("calendar") },
    { path: "/feedback", icon: MessageSquareHeart, label: "Pesquisa de Clima" },
    { path: "/history", icon: History, label: t("history") },
  ];

  if (isAdmin || isGestor) {
    navItems.push({
      path: "/smartforms",
      icon: FileText,
      label: t("smartforms"),
    });
  }
  if (isAdmin) {
    navItems.push({ path: "/admin", icon: Settings, label: t("admin") });
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!collapsed && (
          <h1 className="text-lg font-bold text-primary">{t("appName")}</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hidden md:flex"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex flex-col gap-1 p-2 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  title={`${item.badge} ${item.badge === 1 ? "acao pendente" : "acoes pendentes"}`}
                  className={cn(
                    "text-xs h-5 min-w-[20px] flex items-center justify-center cursor-default",
                    collapsed ? "absolute -top-1 -right-1" : "ml-auto",
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
