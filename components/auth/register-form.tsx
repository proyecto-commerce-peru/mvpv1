"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: signUpError } = await authClient.signUp.email({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (signUpError) {
      setError(
        signUpError.message?.includes("already")
          ? "Ya existe una cuenta con ese email."
          : "No se pudo crear la cuenta. Intenta nuevamente."
      );
      setIsLoading(false);
      return;
    }

    router.push("/dashboard/onboarding");
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard/onboarding",
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            WhatsApp Commerce
          </h1>
          <p className="text-muted-foreground text-sm">
            Vende más con tu negocio en WhatsApp
          </p>
        </div>

        {/* Card */}
        <Card className="bg-card border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-foreground">
              Crear cuenta
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Ingresa tus datos para registrarte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Nombre */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-foreground"
                >
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-foreground"
                >
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-foreground"
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-9 pr-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    O continúa con
                  </span>
                </div>
              </div>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-border text-foreground hover:bg-secondary bg-transparent"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
