"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Plus,
  Settings2,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  active: boolean;
  type: "standard" | "express" | "pickup" | "free";
}

const sampleMethods: ShippingMethod[] = [
  {
    id: "method-001",
    name: "Envío Estándar",
    description: "Entrega en todo el país",
    price: 99,
    estimatedDays: "5-7 días",
    active: true,
    type: "standard",
  },
  {
    id: "method-002",
    name: "Envío Express",
    description: "Entrega rápida garantizada",
    price: 199,
    estimatedDays: "1-2 días",
    active: true,
    type: "express",
  },
  {
    id: "method-003",
    name: "Recoger en Tienda",
    description: "Recoge tu pedido sin costo",
    price: 0,
    estimatedDays: "Mismo día",
    active: true,
    type: "pickup",
  },
  {
    id: "method-004",
    name: "Envío Gratis",
    description: "Compras mayores a $500",
    price: 0,
    estimatedDays: "5-7 días",
    active: false,
    type: "free",
  },
];

const getTypeIcon = (type: ShippingMethod["type"]) => {
  switch (type) {
    case "express":
      return Clock;
    case "pickup":
      return MapPin;
    case "free":
      return Package;
    default:
      return Truck;
  }
};

const getTypeColor = (type: ShippingMethod["type"]) => {
  switch (type) {
    case "express":
      return "bg-orange-500/10 text-orange-500";
    case "pickup":
      return "bg-blue-500/10 text-blue-500";
    case "free":
      return "bg-primary/10 text-primary";
    default:
      return "bg-purple-500/10 text-purple-500";
  }
};

export default function ShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>(sampleMethods);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    freeShippingThreshold: 500,
    calculateByWeight: false,
    showEstimatedDates: true,
  });

  const toggleMethod = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const deleteMethod = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const activeMethods = methods.filter((m) => m.active).length;

  return (
    <>
      <DashboardHeader
        title="Forma de envío"
        description="Configura métodos de envío para tus clientes"
        action={{
          label: "Agregar método",
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
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Métodos activos</p>
                  <p className="text-xl font-semibold text-foreground">
                    {activeMethods}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Envíos este mes</p>
                  <p className="text-xl font-semibold text-foreground">156</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tasa de entrega</p>
                  <p className="text-xl font-semibold text-foreground">98.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Methods */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Métodos de envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {methods.map((method) => {
                const TypeIcon = getTypeIcon(method.type);

                return (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-colors",
                      method.active
                        ? "bg-secondary/30 hover:bg-secondary/50"
                        : "bg-secondary/10 opacity-60"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        getTypeColor(method.type)
                      )}
                    >
                      <TypeIcon className="w-6 h-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {method.name}
                        </p>
                        {!method.active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {method.description}
                      </p>
                    </div>

                    {/* Price & Time */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {method.price === 0 ? "Gratis" : `$${method.price}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {method.estimatedDays}
                      </p>
                    </div>

                    {/* Toggle */}
                    <Switch
                      checked={method.active}
                      onCheckedChange={() => toggleMethod(method.id)}
                    />

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
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMethod(method.id)}
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

        {/* Settings */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              Configuración de envíos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monto mínimo para envío gratis</Label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      freeShippingThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="pl-7 bg-secondary/50 border-border/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pedidos superiores a este monto tendrán envío gratis
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Calcular por peso
                </p>
                <p className="text-xs text-muted-foreground">
                  Ajustar precio según peso del pedido
                </p>
              </div>
              <Switch
                checked={settings.calculateByWeight}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, calculateByWeight: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mostrar fechas estimadas
                </p>
                <p className="text-xs text-muted-foreground">
                  Mostrar fecha de entrega al cliente
                </p>
              </div>
              <Switch
                checked={settings.showEstimatedDates}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showEstimatedDates: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Add Method Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Agregar método de envío</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nombre del método</Label>
              <Input
                placeholder="Ej: Envío Express"
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                placeholder="Ej: Entrega en 24-48 horas"
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="99"
                    className="pl-7 bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tiempo estimado</Label>
                <Input
                  placeholder="3-5 días"
                  className="bg-secondary/50 border-border/50"
                />
              </div>
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
                Agregar método
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
