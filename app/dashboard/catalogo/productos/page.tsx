"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  ProductEditDrawer,
  type Product,
} from "@/components/catalog/product-edit-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Package,
  Edit2,
  MoreVertical,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sampleProducts: Product[] = [
  {
    id: "PROD-001",
    name: "Camiseta Premium Algodón",
    description: "Camiseta de algodón 100% premium, suave y cómoda.",
    category: "Ropa",
    price: 45.0,
    comparePrice: 55.0,
    sku: "CAM-PREM-001",
    stock: 150,
    type: "configurable",
    active: true,
  },
  {
    id: "PROD-002",
    name: "Zapatillas Running Pro",
    description: "Zapatillas deportivas para running de alto rendimiento.",
    category: "Calzado",
    price: 120.0,
    sku: "ZAP-RUN-002",
    stock: 45,
    type: "configurable",
    active: true,
  },
  {
    id: "PROD-003",
    name: "Bolso Cuero Elegante",
    description: "Bolso de cuero genuino con acabados premium.",
    category: "Accesorios",
    price: 85.0,
    sku: "BOL-CUE-003",
    stock: 30,
    type: "unit",
    active: true,
  },
  {
    id: "PROD-004",
    name: "Membresía VIP Mensual",
    description: "Acceso exclusivo a descuentos y productos premium.",
    category: "Membresías",
    price: 29.99,
    sku: "MEM-VIP-004",
    stock: 999,
    type: "membership",
    active: true,
  },
  {
    id: "PROD-005",
    name: "Consultoría Express",
    description: "Sesión de consultoría personalizada de 1 hora.",
    category: "Servicios",
    price: 150.0,
    sku: "SER-CON-005",
    stock: 999,
    type: "service",
    active: false,
  },
  {
    id: "PROD-006",
    name: "Reloj Clásico Dorado",
    description: "Reloj analógico con correa de cuero y detalles dorados.",
    category: "Accesorios",
    price: 250.0,
    comparePrice: 299.0,
    sku: "REL-CLA-006",
    stock: 20,
    type: "unit",
    active: true,
  },
];

const getTypeLabel = (type: Product["type"]) => {
  switch (type) {
    case "unit":
      return "Unitario";
    case "configurable":
      return "SKU configurable";
    case "membership":
      return "Membresía";
    case "service":
      return "Servicio";
    default:
      return type;
  }
};

const getTypeColor = (type: Product["type"]) => {
  switch (type) {
    case "configurable":
      return "bg-blue-500/10 text-blue-400";
    case "unit":
      return "bg-primary/10 text-primary";
    case "membership":
      return "bg-purple-500/10 text-purple-400";
    case "service":
      return "bg-orange-500/10 text-orange-400";
    default:
      return "bg-secondary text-muted-foreground";
  }
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleToggleActive = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, active: !p.active } : p))
    );
  };

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <>
      <DashboardHeader
        title="Productos"
        description={`${products.length} productos en tu catálogo`}
        action={{
          label: "Agregar producto",
          onClick: () => {},
        }}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`bg-card border-border/50 hover:border-border transition-colors ${
                !product.active ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Image Placeholder */}
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(product.id)}
                          >
                            {product.active ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                          product.type
                        )}`}
                      >
                        {getTypeLabel(product.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-foreground">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.comparePrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.comparePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Edit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                  className="w-full mt-4 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-3 h-3 mr-1.5" />
                  Editar producto
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No se encontraron productos
            </p>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      <ProductEditDrawer
        product={selectedProduct}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveProduct}
      />
    </>
  );
}
