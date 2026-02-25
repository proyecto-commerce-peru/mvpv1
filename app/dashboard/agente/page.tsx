"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Sparkles,
  MessageCircle,
  Save,
  Loader2,
  Zap,
  Brain,
  Settings2,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const toneOptions = [
  {
    id: "professional",
    label: "Profesional",
    description: "Formal y cortés",
    icon: "👔",
  },
  {
    id: "friendly",
    label: "Amigable",
    description: "Cercano y casual",
    icon: "😊",
  },
  {
    id: "enthusiastic",
    label: "Entusiasta",
    description: "Energético y positivo",
    icon: "🎉",
  },
  {
    id: "concise",
    label: "Conciso",
    description: "Directo al punto",
    icon: "⚡",
  },
];

export default function AgentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState("friendly");
  const [responseSpeed, setResponseSpeed] = useState([70]);
  const [creativity, setCreativity] = useState([50]);
  const [settings, setSettings] = useState({
    welcomeMessage:
      "¡Hola! Soy el asistente de Mi Tienda Online. ¿En qué puedo ayudarte hoy?",
    personality:
      "Soy un asistente amable y servicial. Me encanta ayudar a los clientes a encontrar el producto perfecto.",
    instructions:
      "Siempre saluda cordialmente. Ofrece productos relacionados cuando sea apropiado. Confirma disponibilidad antes de procesar pedidos.",
    language: "es",
  });

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <>
      <DashboardHeader
        title="Agente IA"
        description="Configura el comportamiento de tu asistente"
      />

      <div className="p-6 space-y-6">
        {/* Agent Status */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center glow-green">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    Agente SumQo
                  </h3>
                  <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Activo
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Respondiendo conversaciones automáticamente
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-foreground">1,250</p>
                <p className="text-xs text-muted-foreground">
                  mensajes este mes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tone Selection */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              Tono de comunicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {toneOptions.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    selectedTone === tone.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-secondary/30 hover:border-border"
                  )}
                >
                  <span className="text-2xl mb-2 block">{tone.icon}</span>
                  <p className="text-sm font-medium text-foreground">
                    {tone.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tone.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Parameters */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Brain className="w-5 h-5 text-muted-foreground" />
              Parámetros de IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Velocidad de respuesta</Label>
                  <p className="text-xs text-muted-foreground">
                    Qué tan rápido responde el agente
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground w-12">
                    {responseSpeed[0]}%
                  </span>
                </div>
              </div>
              <Slider
                value={responseSpeed}
                onValueChange={setResponseSpeed}
                max={100}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Creatividad</Label>
                  <p className="text-xs text-muted-foreground">
                    Variación en las respuestas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-foreground w-12">
                    {creativity[0]}%
                  </span>
                </div>
              </div>
              <Slider
                value={creativity}
                onValueChange={setCreativity}
                max={100}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Idioma principal</Label>
              <Select
                value={settings.language}
                onValueChange={(value) =>
                  setSettings({ ...settings, language: value })
                }
              >
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
              Mensajes personalizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome">Mensaje de bienvenida</Label>
              <Textarea
                id="welcome"
                value={settings.welcomeMessage}
                onChange={(e) =>
                  setSettings({ ...settings, welcomeMessage: e.target.value })
                }
                className="bg-secondary/50 border-border/50 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality">Personalidad del agente</Label>
              <Textarea
                id="personality"
                value={settings.personality}
                onChange={(e) =>
                  setSettings({ ...settings, personality: e.target.value })
                }
                className="bg-secondary/50 border-border/50 min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Describe cómo quieres que se comporte tu agente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instrucciones especiales</Label>
              <Textarea
                id="instructions"
                value={settings.instructions}
                onChange={(e) =>
                  setSettings({ ...settings, instructions: e.target.value })
                }
                className="bg-secondary/50 border-border/50 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Reglas específicas que el agente debe seguir
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              Vista previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    Agente SumQo
                  </p>
                  <p className="text-sm text-foreground">
                    {settings.welcomeMessage}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar configuración
          </Button>
        </div>
      </div>
    </>
  );
}
