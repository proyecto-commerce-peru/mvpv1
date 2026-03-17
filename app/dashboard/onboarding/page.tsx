"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SumQoLogo } from "@/components/sumqo-logo";
import { Building2, FileText, Globe, ArrowRight, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    legal_name: "",
    tax_id: "",
    country_code: "PE",
  });

  // Auto-generar slug desde el nombre
  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    setFormData({ ...formData, name: value, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/internal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la información del negocio.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <SumQoLogo size="lg" />
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Cuéntanos sobre tu negocio
          </h1>
          <p className="text-muted-foreground text-sm">
            Hola{session?.user?.name ? `, ${session.user.name}` : ""}. Solo necesitamos
            unos datos para configurar tu cuenta.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Nombre del negocio */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              Nombre del negocio <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Mi Tienda"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="pl-10 h-11"
                required
              />
            </div>
          </div>

          {/* Slug / URL */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm text-muted-foreground">
              Identificador único (URL)
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="slug"
                type="text"
                placeholder="mi-tienda"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="pl-10 h-11"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo letras, números y guiones. Ej: mi-tienda-lima
            </p>
          </div>

          {/* Razón social (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="legal_name" className="text-sm text-muted-foreground">
              Razón social <span className="text-muted-foreground/60">(opcional)</span>
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="legal_name"
                type="text"
                placeholder="Mi Empresa S.A.C."
                value={formData.legal_name}
                onChange={(e) =>
                  setFormData({ ...formData, legal_name: e.target.value })
                }
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* RUC / Tax ID (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="tax_id" className="text-sm text-muted-foreground">
              RUC <span className="text-muted-foreground/60">(opcional)</span>
            </Label>
            <Input
              id="tax_id"
              type="text"
              placeholder="20123456789"
              value={formData.tax_id}
              onChange={(e) =>
                setFormData({ ...formData, tax_id: e.target.value })
              }
              className="h-11"
              maxLength={20}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continuar al dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

