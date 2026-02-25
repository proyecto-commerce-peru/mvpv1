"use client";

import React from "react"

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileSpreadsheet, FileJson, FileCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  className?: string;
}

const formatIcons: Record<string, typeof FileSpreadsheet> = {
  csv: FileSpreadsheet,
  json: FileJson,
  xml: FileCode,
};

export function FileUploadZone({
  onFileSelect,
  acceptedFormats,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (selectedFile) {
    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    const Icon = formatIcons[extension] || FileSpreadsheet;

    return (
      <div className={cn("p-6 rounded-xl border border-border bg-card", className)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeFile}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-secondary/30",
        className
      )}
    >
      <input
        type="file"
        accept={acceptedFormats.map((f) => `.${f}`).join(",")}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
            isDragging ? "bg-primary/20" : "bg-secondary"
          )}
        >
          <Upload
            className={cn(
              "w-8 h-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        <p className="text-foreground font-medium mb-1">
          {isDragging ? "Suelta el archivo aquí" : "Arrastra tu catálogo aquí"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          o haz clic para seleccionar
        </p>

        <div className="flex items-center gap-3">
          {acceptedFormats.map((format) => {
            const Icon = formatIcons[format] || FileSpreadsheet;
            return (
              <div
                key={format}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs text-muted-foreground"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="uppercase">{format}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
