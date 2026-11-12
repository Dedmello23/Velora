"use client";

import { useTheme } from "@/components/ThemeContext";

interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center justify-center transition-all ${className}`}>
      {/* 
        Theme-adaptive Logo:
        When you provide your logo image, we can place:
        - /logo-light.png
        - /logo-dark.png
        - /logo-gradient.png
        (or a single /logo.png with theme-based filters)
      */}
      <div className="relative flex items-center justify-center h-10 w-full">
        {theme === "light" && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white font-black text-lg shadow-sm">
              V
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900">
              Velora
            </span>
          </div>
        )}

        {theme === "dark" && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-900 font-black text-lg shadow-sm shadow-white/10">
              V
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Velora
            </span>
          </div>
        )}

        {theme === "gradient" && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-400 text-white font-black text-lg shadow-md shadow-indigo-500/25">
              V
            </div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-rose-300 bg-clip-text text-transparent">
              Velora
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
