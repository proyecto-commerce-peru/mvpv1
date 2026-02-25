"use client";

import { cn } from "@/lib/utils";
import {
  FileSearch,
  Sparkles,
  ImageIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

export type ProcessingStep = {
  id: string;
  label: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  details?: string;
};

const stepIcons = {
  analyze: FileSearch,
  clean: Sparkles,
  images: ImageIcon,
  validate: CheckCircle2,
};

interface AIProcessingStepsProps {
  steps: ProcessingStep[];
  className?: string;
}

export function AIProcessingSteps({ steps, className }: AIProcessingStepsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const Icon = stepIcons[step.id as keyof typeof stepIcons] || FileSearch;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-5 top-12 w-0.5 h-8 transition-colors",
                  step.status === "completed" ? "bg-primary" : "bg-border"
                )}
              />
            )}

            <div
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border transition-all",
                step.status === "processing"
                  ? "bg-primary/5 border-primary/30"
                  : step.status === "completed"
                    ? "bg-card border-border/50"
                    : step.status === "error"
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-card/50 border-border/30"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                  step.status === "processing"
                    ? "bg-primary/20"
                    : step.status === "completed"
                      ? "bg-primary/10"
                      : step.status === "error"
                        ? "bg-destructive/10"
                        : "bg-secondary"
                )}
              >
                {step.status === "processing" ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : step.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : step.status === "error" ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.status === "pending"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.status === "processing" && (
                    <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                      Procesando
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
                {step.details && step.status !== "pending" && (
                  <p
                    className={cn(
                      "text-xs mt-2 font-medium",
                      step.status === "error"
                        ? "text-destructive"
                        : "text-primary"
                    )}
                  >
                    {step.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
