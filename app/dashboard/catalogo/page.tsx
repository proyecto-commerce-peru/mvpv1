"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { FileUploadZone } from "@/components/catalog/file-upload-zone";
import {
  AIProcessingSteps,
  type ProcessingStep,
} from "@/components/catalog/ai-processing-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

type UploadState = "idle" | "processing" | "preview" | "error";

const initialSteps: ProcessingStep[] = [
  {
    id: "analyze",
    label: "Analizando archivo",
    description: "Detectando estructura y formato del catálogo",
    status: "pending",
  },
  {
    id: "clean",
    label: "Limpiando datos",
    description: "Corrigiendo errores y estandarizando información",
    status: "pending",
  },
  {
    id: "images",
    label: "Procesando imágenes",
    description: "Validando y optimizando imágenes de productos",
    status: "pending",
  },
  {
    id: "validate",
    label: "Validación final",
    description: "Verificando consistencia y generando IDs únicos",
    status: "pending",
  },
];

// Sample preview data
const sampleProducts = [
  {
    id: "PROD-001",
    name: "Camiseta Premium Algodón",
    category: "Ropa",
    price: "$45.00",
    type: "SKU configurable",
    status: "valid",
  },
  {
    id: "PROD-002",
    name: "Zapatillas Running Pro",
    category: "Calzado",
    price: "$120.00",
    type: "Unitario",
    status: "valid",
  },
  {
    id: "PROD-003",
    name: "Bolso Cuero Elegante",
    category: "Accesorios",
    price: "$85.00",
    type: "Unitario",
    status: "warning",
  },
  {
    id: "PROD-004",
    name: "Membresía VIP Mensual",
    category: "Membresías",
    price: "$29.99/mes",
    type: "Membresía",
    status: "valid",
  },
  {
    id: "PROD-005",
    name: "Consultoría Express",
    category: "Servicios",
    price: "$150.00",
    type: "Servicio",
    status: "valid",
  },
];

export default function CatalogPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    setUploadState("processing");
    simulateProcessing();
  };

  const simulateProcessing = () => {
    const stepDelays = [1500, 2500, 3500, 4500];

    stepDelays.forEach((delay, index) => {
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => {
            if (i < index) return { ...step, status: "completed" as const };
            if (i === index)
              return { ...step, status: "processing" as const, details: getStepDetails(step.id) };
            return step;
          })
        );
      }, delay);
    });

    setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: "completed" as const,
          details: getStepDetails(step.id),
        }))
      );
      setUploadState("preview");
    }, 5000);
  };

  const getStepDetails = (stepId: string): string => {
    switch (stepId) {
      case "analyze":
        return "5 columnas detectadas, 127 filas encontradas";
      case "clean":
        return "12 errores corregidos automáticamente";
      case "images":
        return "98 imágenes válidas, 5 generadas por IA";
      case "validate":
        return "Todos los productos tienen ID único";
      default:
        return "";
    }
  };

  const resetUpload = () => {
    setUploadState("idle");
    setSteps(initialSteps);
    setFileName("");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SKU configurable":
        return "bg-blue-500/10 text-blue-400";
      case "Unitario":
        return "bg-primary/10 text-primary";
      case "Membresía":
        return "bg-purple-500/10 text-purple-400";
      case "Servicio":
        return "bg-orange-500/10 text-orange-400";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <>
      <DashboardHeader
        title="Catálogo"
        description="Sube y gestiona tu catálogo de productos con IA"
        action={
          uploadState === "preview"
            ? {
                label: "Nuevo catálogo",
                onClick: resetUpload,
              }
            : undefined
        }
      />

      <div className="p-6">
        {uploadState === "idle" && (
          <div className="max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Carga inteligente de catálogo
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto text-balance">
                Sube tu archivo y la IA limpiará, validará y optimizará tus
                productos automáticamente
              </p>
            </div>

            {/* Upload Zone */}
            <FileUploadZone
              onFileSelect={handleFileSelect}
              acceptedFormats={["csv", "json", "xml"]}
              className="mb-8"
            />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Limpieza automática",
                  description: "Corrige errores y normaliza datos",
                },
                {
                  title: "IDs generados",
                  description: "Crea identificadores únicos",
                },
                {
                  title: "Imágenes con IA",
                  description: "Genera imágenes faltantes",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-xl bg-card border border-border/50 text-center"
                >
                  <p className="text-sm font-medium text-foreground mb-1">
                    {feature.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadState === "processing" && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Procesando {fileName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIProcessingSteps steps={steps} />
              </CardContent>
            </Card>
          </div>
        )}

        {uploadState === "preview" && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Catálogo procesado exitosamente
                </p>
                <p className="text-xs text-muted-foreground">
                  {sampleProducts.length} productos listos para publicar
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Cargar otro
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Publicar catálogo
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>

            {/* Products Preview */}
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  Vista previa del catálogo
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {sampleProducts.length} productos
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      {/* Product Image Placeholder */}
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {product.name}
                          </p>
                          {product.status === "warning" && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{product.id}</span>
                          <span>•</span>
                          <span>{product.category}</span>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          product.type
                        )}`}
                      >
                        {product.type}
                      </span>

                      {/* Price */}
                      <span className="text-sm font-medium text-foreground w-24 text-right">
                        {product.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Mostrando 5 de 127 productos
                  </p>
                  <Link href="/dashboard/catalogo/productos">
                    <Button variant="ghost" size="sm" className="text-primary">
                      Ver todos
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
