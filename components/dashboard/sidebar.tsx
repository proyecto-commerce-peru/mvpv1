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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navSections = [
  {
    title: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
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
      },
      {
        label: "Productos",
        href: "/dashboard/catalogo/productos",
        icon: Package,
      },
      {
        label: "Imágenes",
        href: "/dashboard/imagenes",
        icon: ImageIcon,
      },
      {
        label: "Precios",
        href: "/dashboard/precios",
        icon: DollarSign,
      },
      {
        label: "Prioridad",
        href: "/dashboard/prioridad",
        icon: Star,
      },
      {
        label: "Promociones",
        href: "/dashboard/promociones",
        icon: Tag,
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
      },
      {
        label: "WhatsApp",
        href: "/dashboard/whatsapp",
        icon: MessageCircle,
      },
      {
        label: "Agente IA",
        href: "/dashboard/agente",
        icon: Bot,
      },
      {
        label: "Forma de pago",
        href: "/dashboard/pagos",
        icon: CreditCard,
      },
      {
        label: "Forma de envío",
        href: "/dashboard/envios",
        icon: Truck,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            onClick={() => setIsCollapsed(!isCollapsed)}
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
          {navSections.map((section) => (
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
          ))}
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
                    onClick={() => setIsCollapsed(false)}
                    className="w-full h-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expandir</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full h-10 text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </Link>
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
              <Link href="/">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </Button>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
