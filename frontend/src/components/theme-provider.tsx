import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "violet";

const THEMES: Theme[] = ["dark", "light", "violet"];

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSavedTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const savedTheme = window.localStorage.getItem("kiday-theme");
  return THEMES.includes(savedTheme as Theme) ? (savedTheme as Theme) : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
    window.localStorage.setItem("kiday-theme", nextTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="theme-shell min-h-screen">{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return context;
}
