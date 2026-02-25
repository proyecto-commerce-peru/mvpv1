"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Upload,
  Sparkles,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  ImageIcon,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  productId: string;
  productName: string;
  url?: string;
  status: "valid" | "rejected" | "ai-generated" | "pending";
  reason?: string;
}

const sampleImages: ProductImage[] = [
  {
    id: "img-001",
    productId: "PROD-001",
    productName: "Camiseta Premium Algodón",
    status: "valid",
  },
  {
    id: "img-002",
    productId: "PROD-002",
    productName: "Zapatillas Running Pro",
    status: "valid",
  },
  {
    id: "img-003",
    productId: "PROD-003",
    productName: "Bolso Cuero Elegante",
    status: "rejected",
    reason: "Resolución muy baja",
  },
  {
    id: "img-004",
    productId: "PROD-004",
    productName: "Membresía VIP Mensual",
    status: "ai-generated",
  },
  {
    id: "img-005",
    productId: "PROD-005",
    productName: "Consultoría Express",
    status: "ai-generated",
  },
  {
    id: "img-006",
    productId: "PROD-006",
    productName: "Reloj Clásico Dorado",
    status: "valid",
  },
  {
    id: "img-007",
    productId: "PROD-007",
    productName: "Gorra Deportiva",
    status: "pending",
  },
  {
    id: "img-008",
    productId: "PROD-008",
    productName: "Sudadera Urbana",
    status: "rejected",
    reason: "Imagen borrosa",
  },
];

const getStatusInfo = (status: ProductImage["status"]) => {
  switch (status) {
    case "valid":
      return {
        label: "Validada",
        icon: CheckCircle2,
        color: "text-primary bg-primary/10",
      };
    case "rejected":
      return {
        label: "Rechazada",
        icon: XCircle,
        color: "text-destructive bg-destructive/10",
      };
    case "ai-generated":
      return {
        label: "Generada IA",
        icon: Sparkles,
        color: "text-purple-400 bg-purple-400/10",
      };
    case "pending":
      return {
        label: "Pendiente",
        icon: RefreshCw,
        color: "text-yellow-400 bg-yellow-400/10",
      };
    default:
      return {
        label: status,
        icon: ImageIcon,
        color: "text-muted-foreground bg-muted",
      };
  }
};

export default function ImagesPage() {
  const [images, setImages] = useState<ProductImage[]>(sampleImages);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredImages = images.filter((image) => {
    const matchesSearch = image.productName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || image.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: images.length,
    valid: images.filter((i) => i.status === "valid").length,
    rejected: images.filter((i) => i.status === "rejected").length,
    aiGenerated: images.filter((i) => i.status === "ai-generated").length,
  };

  const regenerateImage = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "ai-generated" as const } : img
      )
    );
  };

  return (
    <>
      <DashboardHeader
        title="Imágenes"
        description="Gestiona las imágenes de tu catálogo"
        action={{
          label: "Subir imágenes",
          onClick: () => {},
        }}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.total}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Validadas</p>
              <p className="text-2xl font-semibold text-primary">
                {stats.valid}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Rechazadas</p>
              <p className="text-2xl font-semibold text-destructive">
                {stats.rejected}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Generadas IA</p>
              <p className="text-2xl font-semibold text-purple-400">
                {stats.aiGenerated}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="valid">Validadas</SelectItem>
                    <SelectItem value="rejected">Rechazadas</SelectItem>
                    <SelectItem value="ai-generated">Generadas IA</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => {
            const statusInfo = getStatusInfo(image.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={image.id}
                className="bg-card border-border/50 overflow-hidden group"
              >
                {/* Image */}
                <div className="aspect-square bg-secondary relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                  </div>

                  {/* Status Badge */}
                  <div
                    className={cn(
                      "absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      statusInfo.color
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Upload className="w-4 h-4" />
                    </Button>
                    {image.status === "rejected" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => regenerateImage(image.id)}
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {image.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {image.productId}
                      </p>
                      {image.reason && (
                        <p className="text-xs text-destructive mt-1">
                          {image.reason}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Upload className="w-4 h-4 mr-2" />
                          Reemplazar
                        </DropdownMenuItem>
                        {image.status === "rejected" && (
                          <DropdownMenuItem
                            onClick={() => regenerateImage(image.id)}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generar con IA
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No se encontraron imágenes
            </p>
          </div>
        )}
      </div>
    </>
  );
}
