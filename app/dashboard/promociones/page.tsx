"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tag,
  Plus,
  Calendar,
  Percent,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Promotion {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "2x1";
  discount: number;
  status: "active" | "scheduled" | "expired" | "paused";
  startDate: string;
  endDate: string;
  appliesTo: string;
  usageCount: number;
}

const samplePromotions: Promotion[] = [
  {
    id: "promo-001",
    name: "Descuento de Verano",
    type: "percentage",
    discount: 20,
    status: "active",
    startDate: "2026-01-15",
    endDate: "2026-02-28",
    appliesTo: "Toda la tienda",
    usageCount: 145,
  },
  {
    id: "promo-002",
    name: "Oferta Flash",
    type: "percentage",
    discount: 35,
    status: "active",
    startDate: "2026-02-01",
    endDate: "2026-02-03",
    appliesTo: "Ropa",
    usageCount: 52,
  },
  {
    id: "promo-003",
    name: "2x1 en Accesorios",
    type: "2x1",
    discount: 50,
    status: "scheduled",
    startDate: "2026-02-10",
    endDate: "2026-02-14",
    appliesTo: "Accesorios",
    usageCount: 0,
  },
  {
    id: "promo-004",
    name: "Descuento Black Friday",
    type: "percentage",
    discount: 50,
    status: "expired",
    startDate: "2025-11-24",
    endDate: "2025-11-27",
    appliesTo: "Toda la tienda",
    usageCount: 320,
  },
  {
    id: "promo-005",
    name: "Membresía Premium",
    type: "fixed",
    discount: 10,
    status: "paused",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    appliesTo: "Membresías",
    usageCount: 28,
  },
];

const getStatusInfo = (status: Promotion["status"]) => {
  switch (status) {
    case "active":
      return {
        label: "Activa",
        color: "bg-primary/10 text-primary",
        dot: "bg-primary",
      };
    case "scheduled":
      return {
        label: "Programada",
        color: "bg-blue-500/10 text-blue-400",
        dot: "bg-blue-400",
      };
    case "expired":
      return {
        label: "Expirada",
        color: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
      };
    case "paused":
      return {
        label: "Pausada",
        color: "bg-yellow-500/10 text-yellow-500",
        dot: "bg-yellow-500",
      };
    default:
      return {
        label: status,
        color: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
      };
  }
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(samplePromotions);
  const [dialogOpen, setDialogOpen] = useState(false);

  const stats = {
    active: promotions.filter((p) => p.status === "active").length,
    scheduled: promotions.filter((p) => p.status === "scheduled").length,
    totalUsage: promotions.reduce((acc, p) => acc + p.usageCount, 0),
  };

  const togglePromotion = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: p.status === "active" ? "paused" : ("active" as const),
          };
        }
        return p;
      })
    );
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <DashboardHeader
        title="Promociones"
        description="Gestiona ofertas y descuentos"
        action={{
          label: "Nueva promoción",
          onClick: () => setDialogOpen(true),
        }}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Activas</p>
                  <p className="text-xl font-semibold text-foreground">
                    {stats.active}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Programadas</p>
                  <p className="text-xl font-semibold text-foreground">
                    {stats.scheduled}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usos totales</p>
                  <p className="text-xl font-semibold text-foreground">
                    {stats.totalUsage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promotions List */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Tus promociones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {promotions.map((promo) => {
                const statusInfo = getStatusInfo(promo.status);

                return (
                  <div
                    key={promo.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-colors",
                      promo.status === "expired"
                        ? "bg-secondary/20 opacity-60"
                        : "bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      {promo.type === "percentage" ? (
                        <Percent className="w-6 h-6 text-primary" />
                      ) : promo.type === "2x1" ? (
                        <span className="text-lg font-bold text-primary">
                          2x1
                        </span>
                      ) : (
                        <Tag className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {promo.name}
                        </p>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                            statusInfo.color
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              statusInfo.dot
                            )}
                          />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {promo.startDate} - {promo.endDate}
                        </span>
                        <span>•</span>
                        <span>{promo.appliesTo}</span>
                      </div>
                    </div>

                    {/* Discount Value */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        {promo.type === "2x1"
                          ? "2x1"
                          : promo.type === "percentage"
                            ? `${promo.discount}%`
                            : `$${promo.discount}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {promo.usageCount} usos
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {promo.status !== "expired" && (
                          <DropdownMenuItem
                            onClick={() => togglePromotion(promo.id)}
                          >
                            {promo.status === "active" ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deletePromotion(promo.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Promotion Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nueva promoción</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nombre de la promoción</Label>
              <Input
                placeholder="Ej: Descuento de Verano"
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de descuento</Label>
                <Select defaultValue="percentage">
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                    <SelectItem value="2x1">2x1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  placeholder="20"
                  className="bg-secondary/50 border-border/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input type="date" className="bg-secondary/50 border-border/50" />
              </div>

              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input type="date" className="bg-secondary/50 border-border/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aplica a</Label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda la tienda</SelectItem>
                  <SelectItem value="ropa">Ropa</SelectItem>
                  <SelectItem value="calzado">Calzado</SelectItem>
                  <SelectItem value="accesorios">Accesorios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setDialogOpen(false)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Crear promoción
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
