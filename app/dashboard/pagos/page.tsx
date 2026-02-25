"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Check,
  Percent,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceYearly: number;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Para negocios que inician",
    price: 29,
    priceYearly: 290,
    features: [
      "100 productos",
      "500 mensajes/mes",
      "Agente IA básico",
      "Soporte por email",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "Para negocios en crecimiento",
    price: 79,
    priceYearly: 790,
    features: [
      "500 productos",
      "2,500 mensajes/mes",
      "Agente IA avanzado",
      "Promociones ilimitadas",
      "Soporte prioritario",
    ],
    popular: true,
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes operaciones",
    price: 199,
    priceYearly: 1990,
    features: [
      "Productos ilimitados",
      "Mensajes ilimitados",
      "Agente IA personalizado",
      "API completa",
      "Soporte dedicado 24/7",
      "Integraciones custom",
    ],
  },
];

export default function PaymentsPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <>
      <DashboardHeader
        title="Forma de pago"
        description="Gestiona tu suscripción y facturación"
      />

      <div className="p-6 space-y-6">
        {/* Current Plan Summary */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      Plan Growth
                    </h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Activo
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Próxima facturación: 15 de marzo, 2026
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-foreground">
                  $79<span className="text-sm text-muted-foreground">/mes</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Facturación mensual
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Productos</span>
                <span className="text-sm font-medium text-foreground">
                  127 / 500
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "25%" }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Mensajes</span>
                <span className="text-sm font-medium text-foreground">
                  1,250 / 2,500
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "50%" }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Promociones</span>
                <span className="text-sm font-medium text-primary">
                  Ilimitadas
                </span>
              </div>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Toggle */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4">
              <span
                className={cn(
                  "text-sm font-medium",
                  !isYearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Mensual
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span
                className={cn(
                  "text-sm font-medium",
                  isYearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Anual
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Ahorra 2 meses
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all",
                plan.popular
                  ? "border-2 border-primary bg-primary/5"
                  : "border-border/50 bg-card"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {plan.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold text-foreground">
                    ${isYearly ? plan.priceYearly : plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{isYearly ? "año" : "mes"}
                  </span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full",
                    plan.current
                      ? "bg-secondary text-foreground hover:bg-secondary/80"
                      : plan.popular
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                  disabled={plan.current}
                >
                  {plan.current ? (
                    "Plan actual"
                  ) : (
                    <>
                      Cambiar a {plan.name}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Method */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              Método de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-xs text-muted-foreground">Expira 12/27</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Cambiar
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Pagos procesados de forma segura con encriptación SSL</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
