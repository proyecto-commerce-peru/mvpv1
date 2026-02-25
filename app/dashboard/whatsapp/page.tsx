"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Smartphone,
  RefreshCw,
  Settings2,
  Clock,
  Users,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WhatsAppPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [settings, setSettings] = useState({
    autoReply: true,
    welcomeMessage: true,
    businessHours: true,
    readReceipts: true,
  });

  const stats = {
    conversations: 324,
    messagesThisWeek: 1250,
    responseRate: "98%",
    avgResponseTime: "2 min",
  };

  const handleReconnect = async () => {
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnected(true);
    setIsConnecting(false);
  };

  return (
    <>
      <DashboardHeader
        title="WhatsApp"
        description="Conexión y configuración de WhatsApp Business"
      />

      <div className="p-6 space-y-6">
        {/* Connection Status */}
        <Card
          className={cn(
            "border-2",
            isConnected
              ? "bg-primary/5 border-primary/20"
              : "bg-destructive/5 border-destructive/20"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center",
                    isConnected ? "bg-primary/10" : "bg-destructive/10"
                  )}
                >
                  <MessageCircle
                    className={cn(
                      "w-7 h-7",
                      isConnected ? "text-primary" : "text-destructive"
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      WhatsApp Business
                    </h3>
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Conectado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Desconectado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isConnected
                      ? "+52 55 1234 5678 • Mi Tienda Online"
                      : "Escanea el código QR para conectar"}
                  </p>
                </div>
              </div>

              {isConnected ? (
                <Button
                  variant="outline"
                  onClick={() => setIsConnected(false)}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconectar
                </Button>
              ) : (
                <Button
                  onClick={handleReconnect}
                  disabled={isConnecting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4 mr-2" />
                  )}
                  {isConnecting ? "Conectando..." : "Mostrar QR"}
                </Button>
              )}
            </div>

            {/* QR Code (when disconnected) */}
            {!isConnected && !isConnecting && (
              <div className="mt-6 flex items-center justify-center">
                <div className="p-6 bg-white rounded-xl">
                  <div className="w-48 h-48 bg-muted flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {isConnected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversaciones</p>
                    <p className="text-xl font-semibold text-foreground">
                      {stats.conversations}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Send className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mensajes/semana</p>
                    <p className="text-xl font-semibold text-foreground">
                      {stats.messagesThisWeek}
                    </p>
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
                    <p className="text-xs text-muted-foreground">Tasa de respuesta</p>
                    <p className="text-xl font-semibold text-foreground">
                      {stats.responseRate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                    <p className="text-xl font-semibold text-foreground">
                      {stats.avgResponseTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              Configuración de mensajes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Respuestas automáticas
                </p>
                <p className="text-xs text-muted-foreground">
                  El agente IA responderá automáticamente
                </p>
              </div>
              <Switch
                checked={settings.autoReply}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoReply: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mensaje de bienvenida
                </p>
                <p className="text-xs text-muted-foreground">
                  Enviar saludo cuando inician conversación
                </p>
              </div>
              <Switch
                checked={settings.welcomeMessage}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, welcomeMessage: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Horario comercial
                </p>
                <p className="text-xs text-muted-foreground">
                  Mostrar disponibilidad según horario
                </p>
              </div>
              <Switch
                checked={settings.businessHours}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, businessHours: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Confirmación de lectura
                </p>
                <p className="text-xs text-muted-foreground">
                  Mostrar cuando los mensajes son leídos
                </p>
              </div>
              <Switch
                checked={settings.readReceipts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, readReceipts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Horario de atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de apertura</Label>
                <Input
                  type="time"
                  defaultValue="09:00"
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de cierre</Label>
                <Input
                  type="time"
                  defaultValue="18:00"
                  className="bg-secondary/50 border-border/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Fuera de horario, el agente IA informará tu disponibilidad
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
