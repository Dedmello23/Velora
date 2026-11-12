"use client";

import { useTheme } from "@/components/ThemeContext";

interface BrandLogoProps {
  className?: string;
  collapsed?: boolean;
}

export default function BrandLogo({
  className = "",
  collapsed = false,
}: BrandLogoProps) {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center justify-center transition-all ${className}`}>
      <div className="relative flex items-center justify-center h-10 w-full px-1">
        {theme === "light" ? (
          /* Light theme: Crisp dark logo & mark */
          collapsed ? (
            <img
              src="/velora-mark-dark.png"
              alt="Velora"
              className="h-7 w-auto object-contain"
            />
          ) : (
            <img
              src="/velora-dark.png"
              alt="Velora"
              className="h-7 w-auto max-w-[180px] object-contain animate-in fade-in-50 duration-150"
            />
          )
        ) : (
          /* Dark theme: pure white logo & mark */
          collapsed ? (
            <img
              src="/velora-mark-white.png"
              alt="Velora"
              className="h-7 w-auto object-contain drop-shadow-xs"
            />
          ) : (
            <img
              src="/velora-white.png"
              alt="Velora"
              className="h-7 w-auto max-w-[180px] object-contain drop-shadow-xs animate-in fade-in-50 duration-150"
            />
          )
        )}
      </div>
    </div>
  );
}
