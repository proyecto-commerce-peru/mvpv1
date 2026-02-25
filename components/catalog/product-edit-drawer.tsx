"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Save,
  Trash2,
  ImageIcon,
  DollarSign,
  Boxes,
  MessageCircle,
  Sparkles,
  Check,
  AlertCircle,
  TrendingUp,
  Eye,
  Tag,
} from "lucide-react";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stock: number;
  type: "unit" | "configurable" | "membership" | "service";
  active: boolean;
  imageUrl?: string;
}

interface ProductEditDrawerProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export function ProductEditDrawer({
  product,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: ProductEditDrawerProps) {
  const [formData, setFormData] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  if (!formData) return null;

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const discount = formData.comparePrice
    ? Math.round(
        ((formData.comparePrice - formData.price) / formData.comparePrice) * 100
      )
    : 0;

  const productTypes = {
    unit: { label: "Unitario", icon: Package, color: "text-blue-400" },
    configurable: { label: "Configurable", icon: Boxes, color: "text-purple-400" },
    membership: { label: "Membresía", icon: Tag, color: "text-amber-400" },
    service: { label: "Servicio", icon: Sparkles, color: "text-primary" },
  };

  const TypeInfo = productTypes[formData.type];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-background border-border p-0 flex flex-col"
      >
        {/* Header with product preview */}
        <div className="relative">
          {/* Gradient accent */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

          <SheetHeader className="p-6 pb-4 relative">
            <div className="flex items-start gap-4">
              {/* Product image thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl || "/placeholder.svg"}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-7 h-7 text-muted-foreground/50" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-xs border-primary/30 text-primary bg-primary/10"
                  >
                    <TypeInfo.icon className="w-3 h-3 mr-1" />
                    {TypeInfo.label}
                  </Badge>
                  {formData.active ? (
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactivo
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-lg font-semibold text-foreground truncate">
                  {formData.name || "Sin nombre"}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  SKU: {formData.sku} | {formData.category}
                </SheetDescription>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-xs">Precio</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  ${formData.price.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Boxes className="w-3.5 h-3.5" />
                  <span className="text-xs">Stock</span>
                </div>
                <p
                  className={`text-lg font-semibold ${
                    formData.stock <= 5
                      ? "text-amber-400"
                      : formData.stock === 0
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  {formData.stock}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs">Descuento</span>
                </div>
                <p
                  className={`text-lg font-semibold ${
                    discount > 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {discount > 0 ? `-${discount}%` : "—"}
                </p>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Tabs content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 border-b border-border/50">
            <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-1">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-secondary/80 data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg px-4"
              >
                <Package className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="data-[state=active]:bg-secondary/80 data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg px-4"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Precio
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-secondary/80 data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg px-4"
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista previa
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* General Tab */}
            <TabsContent value="general" className="mt-0 p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre del producto
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  placeholder="Ej: Camiseta básica"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="min-h-[120px] bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 resize-none"
                  placeholder="Describe tu producto..."
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 caracteres
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Categoría
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="h-11 bg-secondary/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ropa">Ropa</SelectItem>
                      <SelectItem value="Calzado">Calzado</SelectItem>
                      <SelectItem value="Accesorios">Accesorios</SelectItem>
                      <SelectItem value="Membresías">Membresías</SelectItem>
                      <SelectItem value="Servicios">Servicios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Tipo de producto
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Product["type"]) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="h-11 bg-secondary/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unitario</SelectItem>
                      <SelectItem value="configurable">
                        SKU configurable
                      </SelectItem>
                      <SelectItem value="membership">Membresía</SelectItem>
                      <SelectItem value="service">Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-medium">
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="h-11 bg-secondary/30 border-border/50 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm font-medium">
                    Stock disponible
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-11 bg-secondary/30 border-border/50"
                  />
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.active
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Visible en WhatsApp
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Los clientes pueden ver y comprar este producto
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="mt-0 p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Precio de venta
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-14 pl-8 text-2xl font-semibold bg-secondary/30 border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comparePrice" className="text-sm font-medium">
                  Precio anterior{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    value={formData.comparePrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comparePrice: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="h-11 pl-8 bg-secondary/30 border-border/50"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Muestra el descuento tachando el precio anterior
                </p>
              </div>

              {discount > 0 && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Descuento activo: {discount}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ahorro de $
                        {(formData.comparePrice! - formData.price).toFixed(2)}{" "}
                        para el cliente
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-0 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span>Así verán tu producto en WhatsApp</span>
                </div>

                {/* WhatsApp-style message preview */}
                <div className="p-4 rounded-2xl bg-[#1f2c34] border border-white/5 max-w-sm">
                  {/* Message bubble */}
                  <div className="bg-[#005c4b] rounded-lg p-3 shadow-sm">
                    {/* Product card inside message */}
                    <div className="bg-[#0b1419] rounded-lg overflow-hidden">
                      {/* Product image area */}
                      <div className="h-32 bg-secondary/50 flex items-center justify-center">
                        {formData.imageUrl ? (
                          <img
                            src={formData.imageUrl || "/placeholder.svg"}
                            alt={formData.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                        )}
                      </div>

                      {/* Product info */}
                      <div className="p-3 space-y-2">
                        <h4 className="font-medium text-white text-sm">
                          {formData.name || "Nombre del producto"}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {formData.description ||
                            "Descripción del producto..."}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-white">
                            ${formData.price.toFixed(2)}
                          </span>
                          {formData.comparePrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${formData.comparePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {discount > 0 && (
                          <Badge className="bg-primary/20 text-primary border-0 text-xs">
                            {discount}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* View product button */}
                    <button className="w-full mt-2 py-2 text-sm font-medium text-[#53bdeb] hover:underline">
                      Ver producto
                    </button>
                  </div>

                  {/* Time stamp */}
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-500">12:34</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Vista aproximada. El diseño real puede variar.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer actions */}
        <SheetFooter className="p-4 border-t border-border/50 bg-secondary/20">
          <div className="flex items-center gap-3 w-full">
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onDelete(formData.id);
                  onOpenChange(false);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
