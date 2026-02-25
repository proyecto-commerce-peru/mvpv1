"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  MessageCircle,
  ShoppingCart,
  DollarSign,
  Users,
  ArrowUpRight,
  Package,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  {
    title: "Conversaciones activas",
    value: "324",
    change: { value: "12%", positive: true },
    icon: MessageCircle,
  },
  {
    title: "Ventas del mes",
    value: "$12,450",
    change: { value: "8%", positive: true },
    icon: DollarSign,
  },
  {
    title: "Pedidos procesados",
    value: "156",
    change: { value: "23%", positive: true },
    icon: ShoppingCart,
  },
  {
    title: "Clientes nuevos",
    value: "89",
    change: { value: "5%", positive: false },
    icon: Users,
  },
];

const recentOrders = [
  {
    id: "#4521",
    customer: "María García",
    product: "Camiseta Premium XL",
    amount: "$45.00",
    status: "Completado",
  },
  {
    id: "#4520",
    customer: "Carlos López",
    product: "Zapatillas Sport",
    amount: "$120.00",
    status: "Enviado",
  },
  {
    id: "#4519",
    customer: "Ana Martínez",
    product: "Bolso Elegante",
    amount: "$85.00",
    status: "Procesando",
  },
  {
    id: "#4518",
    customer: "Juan Rodríguez",
    product: "Reloj Clásico",
    amount: "$250.00",
    status: "Completado",
  },
];

const quickActions = [
  {
    title: "Subir catálogo",
    description: "Importa productos con IA",
    icon: Package,
    href: "/dashboard/catalogo",
  },
  {
    title: "Ver conversaciones",
    description: "Revisa chats recientes",
    icon: MessageCircle,
    href: "/dashboard/whatsapp",
  },
  {
    title: "Configurar agente",
    description: "Personaliza tu asistente IA",
    icon: TrendingUp,
    href: "/dashboard/agente",
  },
];

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader
        title="Dashboard"
        description="Resumen de tu negocio en WhatsApp"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2 bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">
                Pedidos recientes
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                Ver todos
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {order.customer}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.product}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {order.amount}
                      </p>
                      <p
                        className={`text-xs ${
                          order.status === "Completado"
                            ? "text-primary"
                            : order.status === "Enviado"
                              ? "text-blue-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Acciones rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                );
              })}

              {/* AI Status */}
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">
                    Agente IA activo
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tu asistente está respondiendo conversaciones automáticamente
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Última actividad hace 2 min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
