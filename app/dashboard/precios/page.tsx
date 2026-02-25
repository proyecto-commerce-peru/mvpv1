"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Save,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceItem {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  newPrice: number;
  comparePrice?: number;
  margin?: number;
}

const samplePrices: PriceItem[] = [
  {
    id: "PROD-001",
    name: "Camiseta Premium Algodón",
    category: "Ropa",
    currentPrice: 45.0,
    newPrice: 45.0,
    comparePrice: 55.0,
    margin: 35,
  },
  {
    id: "PROD-002",
    name: "Zapatillas Running Pro",
    category: "Calzado",
    currentPrice: 120.0,
    newPrice: 120.0,
    margin: 42,
  },
  {
    id: "PROD-003",
    name: "Bolso Cuero Elegante",
    category: "Accesorios",
    currentPrice: 85.0,
    newPrice: 85.0,
    margin: 50,
  },
  {
    id: "PROD-004",
    name: "Membresía VIP Mensual",
    category: "Membresías",
    currentPrice: 29.99,
    newPrice: 29.99,
    margin: 90,
  },
  {
    id: "PROD-005",
    name: "Consultoría Express",
    category: "Servicios",
    currentPrice: 150.0,
    newPrice: 150.0,
    margin: 80,
  },
  {
    id: "PROD-006",
    name: "Reloj Clásico Dorado",
    category: "Accesorios",
    currentPrice: 250.0,
    newPrice: 250.0,
    comparePrice: 299.0,
    margin: 45,
  },
];

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceItem[]>(samplePrices);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const filteredPrices = prices.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updatePrice = (id: string, newPrice: number) => {
    setPrices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, newPrice } : item))
    );
    setHasChanges(true);
  };

  const resetPrices = () => {
    setPrices(samplePrices);
    setHasChanges(false);
  };

  const savePrices = () => {
    setPrices((prev) =>
      prev.map((item) => ({ ...item, currentPrice: item.newPrice }))
    );
    setHasChanges(false);
  };

  const changedItems = prices.filter(
    (item) => item.currentPrice !== item.newPrice
  );

  return (
    <>
      <DashboardHeader
        title="Precios"
        description="Gestiona los precios de tu catálogo"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Precio promedio</p>
                  <p className="text-xl font-semibold text-foreground">
                    $
                    {(
                      prices.reduce((acc, p) => acc + p.currentPrice, 0) /
                      prices.length
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margen promedio</p>
                  <p className="text-xl font-semibold text-foreground">
                    {Math.round(
                      prices.reduce((acc, p) => acc + (p.margin || 0), 0) /
                        prices.length
                    )}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cambios pendientes</p>
                  <p className="text-xl font-semibold text-foreground">
                    {changedItems.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Actions */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border/50"
                />
              </div>
              {hasChanges && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={resetPrices}>
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Descartar
                  </Button>
                  <Button
                    onClick={savePrices}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Guardar cambios
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prices Table */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Editor de precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                <div className="col-span-5">Producto</div>
                <div className="col-span-2 text-right">Precio actual</div>
                <div className="col-span-2 text-right">Nuevo precio</div>
                <div className="col-span-3 text-right">Vista WhatsApp</div>
              </div>

              {/* Items */}
              {filteredPrices.map((item) => {
                const priceChanged = item.currentPrice !== item.newPrice;
                const priceIncrease = item.newPrice > item.currentPrice;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "grid grid-cols-12 gap-4 px-4 py-3 rounded-lg items-center transition-colors",
                      priceChanged
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    {/* Product Info */}
                    <div className="col-span-5">
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.id} • {item.category}
                      </p>
                    </div>

                    {/* Current Price */}
                    <div className="col-span-2 text-right">
                      <p className="text-sm text-muted-foreground">
                        ${item.currentPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* New Price Input */}
                    <div className="col-span-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          value={item.newPrice}
                          onChange={(e) =>
                            updatePrice(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={cn(
                            "pl-7 h-9 text-right bg-secondary/50 border-border/50",
                            priceChanged &&
                              (priceIncrease
                                ? "border-primary/50"
                                : "border-destructive/50")
                          )}
                        />
                      </div>
                    </div>

                    {/* WhatsApp Preview */}
                    <div className="col-span-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            ${item.newPrice.toFixed(2)}
                          </p>
                          {item.comparePrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              ${item.comparePrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
