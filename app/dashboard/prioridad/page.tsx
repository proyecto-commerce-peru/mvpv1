"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Star,
  StarOff,
  Package,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  priority: number;
  featured: boolean;
}

const sampleProducts: PriorityProduct[] = [
  {
    id: "PROD-001",
    name: "Camiseta Premium Algodón",
    category: "Ropa",
    price: 45.0,
    priority: 1,
    featured: true,
  },
  {
    id: "PROD-002",
    name: "Zapatillas Running Pro",
    category: "Calzado",
    price: 120.0,
    priority: 2,
    featured: true,
  },
  {
    id: "PROD-003",
    name: "Bolso Cuero Elegante",
    category: "Accesorios",
    price: 85.0,
    priority: 3,
    featured: false,
  },
  {
    id: "PROD-004",
    name: "Membresía VIP Mensual",
    category: "Membresías",
    price: 29.99,
    priority: 4,
    featured: true,
  },
  {
    id: "PROD-005",
    name: "Consultoría Express",
    category: "Servicios",
    price: 150.0,
    priority: 5,
    featured: false,
  },
  {
    id: "PROD-006",
    name: "Reloj Clásico Dorado",
    category: "Accesorios",
    price: 250.0,
    priority: 6,
    featured: false,
  },
];

export default function PriorityPage() {
  const [products, setProducts] = useState<PriorityProduct[]>(sampleProducts);
  const [hasChanges, setHasChanges] = useState(false);

  const moveProduct = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    const newProducts = [...products];
    [newProducts[index], newProducts[newIndex]] = [
      newProducts[newIndex],
      newProducts[index],
    ];

    // Update priorities
    newProducts.forEach((product, i) => {
      product.priority = i + 1;
    });

    setProducts(newProducts);
    setHasChanges(true);
  };

  const toggleFeatured = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    );
    setHasChanges(true);
  };

  const resetChanges = () => {
    setProducts(sampleProducts);
    setHasChanges(false);
  };

  const saveChanges = () => {
    setHasChanges(false);
    // In a real app, save to backend
  };

  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <>
      <DashboardHeader
        title="Prioridad"
        description="Organiza el orden de tus productos"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total productos
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {products.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destacados</p>
                  <p className="text-xl font-semibold text-foreground">
                    {featuredCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {hasChanges && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">
                  Tienes cambios sin guardar
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={resetChanges}>
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Descartar
                  </Button>
                  <Button
                    onClick={saveChanges}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Guardar orden
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Orden de productos
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Los productos se mostrarán en este orden a tus clientes en WhatsApp
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg transition-colors",
                    product.featured
                      ? "bg-yellow-500/5 border border-yellow-500/20"
                      : "bg-secondary/30 hover:bg-secondary/50"
                  )}
                >
                  {/* Drag Handle */}
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Priority Number */}
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                    {product.priority}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.category} • ${product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Featured Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFeatured(product.id)}
                    className={cn(
                      "h-8 w-8",
                      product.featured
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-muted-foreground hover:text-yellow-500"
                    )}
                  >
                    {product.featured ? (
                      <Star className="w-5 h-5 fill-current" />
                    ) : (
                      <StarOff className="w-5 h-5" />
                    )}
                  </Button>

                  {/* Move Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveProduct(index, "up")}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveProduct(index, "down")}
                      disabled={index === products.length - 1}
                      className="h-8 w-8"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Productos destacados
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Los productos marcados con estrella aparecerán primero cuando
                  un cliente inicie una conversación o pregunte por
                  recomendaciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
