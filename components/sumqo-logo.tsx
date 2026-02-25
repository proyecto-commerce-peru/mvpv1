"use client";

import { cn } from "@/lib/utils";

interface SumQoLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SumQoLogo({
  className,
  showText = true,
  size = "md",
}: SumQoLogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Main hexagon shape */}
          <path
            d="M20 2L36.6 11V29L20 38L3.4 29V11L20 2Z"
            fill="url(#gradient-fill)"
            stroke="url(#gradient-stroke)"
            strokeWidth="1.5"
          />
          {/* Inner chat bubble / WhatsApp-inspired shape */}
          <path
            d="M20 10C14.48 10 10 14.03 10 19C10 21.24 10.94 23.26 12.5 24.72L11.5 28.5L15.8 27.2C17.06 27.72 18.48 28 20 28C25.52 28 30 23.97 30 19C30 14.03 25.52 10 20 10Z"
            fill="url(#inner-gradient)"
          />
          {/* AI dots */}
          <circle cx="15.5" cy="19" r="1.5" fill="#0a0a0f" />
          <circle cx="20" cy="19" r="1.5" fill="#0a0a0f" />
          <circle cx="24.5" cy="19" r="1.5" fill="#0a0a0f" />
          <defs>
            <linearGradient
              id="gradient-fill"
              x1="3.4"
              y1="2"
              x2="36.6"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#22c55e" stopOpacity="0.1" />
              <stop offset="1" stopColor="#14b8a6" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient
              id="gradient-stroke"
              x1="3.4"
              y1="2"
              x2="36.6"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#22c55e" />
              <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient
              id="inner-gradient"
              x1="10"
              y1="10"
              x2="30"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#22c55e" />
              <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full" />
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight", text)}>
          <span className="text-foreground">Sum</span>
          <span className="text-gradient">Qo</span>
        </span>
      )}
    </div>
  );
}
