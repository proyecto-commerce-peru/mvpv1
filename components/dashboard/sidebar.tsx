"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SumQoLogo } from "@/components/sumqo-logo";
import {
  LayoutDashboard,
  Package,
  ImageIcon,
  DollarSign,
  Star,
  Tag,
  User,
  MessageCircle,
  Bot,
  CreditCard,
  Truck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/lib/hooks/use-permission";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navSections = [
  {
    title: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: null, // visible para todos
      },
    ],
  },
  {
    title: "Catálogo",
    items: [
      {
        label: "Subir catálogo",
        href: "/dashboard/catalogo",
        icon: Upload,
        permission: "catalog:write",
      },
      {
        label: "Productos",
        href: "/dashboard/catalogo/productos",
        icon: Package,
        permission: "catalog:read",
      },
      {
        label: "Imágenes",
        href: "/dashboard/imagenes",
        icon: ImageIcon,
        permission: "images:read",
      },
      {
        label: "Precios",
        href: "/dashboard/precios",
        icon: DollarSign,
        permission: "prices:read",
      },
      {
        label: "Prioridad",
        href: "/dashboard/prioridad",
        icon: Star,
        permission: "catalog:read",
      },
      {
        label: "Promociones",
        href: "/dashboard/promociones",
        icon: Tag,
        permission: "promotions:read",
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        label: "Datos personales",
        href: "/dashboard/perfil",
        icon: User,
        permission: "tenant:read",
      },
      {
        label: "WhatsApp",
        href: "/dashboard/whatsapp",
        icon: MessageCircle,
        permission: "whatsapp:read",
      },
      {
        label: "Agente IA",
        href: "/dashboard/agente",
        icon: Bot,
        permission: "agent:read",
      },
      {
        label: "Forma de pago",
        href: "/dashboard/pagos",
        icon: CreditCard,
        permission: "payments:read",
      },
      {
        label: "Forma de envío",
        href: "/dashboard/envios",
        icon: Truck,
        permission: "shipping:read",
      },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  onCollapsedChange,
}: {
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { permissions, isLoading } = usePermissions();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Filtrar secciones y items según permisos del usuario
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.permission === null || permissions.has(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-sidebar-border px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link href="/dashboard">
            <SumQoLogo size="sm" showText={!isCollapsed} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!isCollapsed)}
            className={cn(
              "h-8 w-8 text-muted-foreground hover:text-foreground",
              isCollapsed && "hidden"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            visibleSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!isCollapsed && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          isActive && "text-primary"
                        )}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {isCollapsed ? (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCollapsedChange(false)}
                    className="w-full h-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expandir</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="w-full h-10 text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar sesión</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-1">
              <Link href="/dashboard/ajustes">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-5 h-5" />
                  Ajustes
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
