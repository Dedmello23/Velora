"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "gradient";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("velora_theme") as Theme) || "light";
    setTheme(saved);
    applyThemeClass(saved);
    setMounted(true);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("velora_theme", newTheme);
    applyThemeClass(newTheme);
  };

  const applyThemeClass = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "theme-gradient");
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "gradient") {
      root.classList.add("dark", "theme-gradient");
    } else {
      root.classList.add("light");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
