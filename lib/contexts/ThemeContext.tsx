"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeId = "heaven" | "hyper";

interface ThemeColors {
  background: string;
  backgroundElevated: string;
  foreground: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  casinoFrom: string;
  casinoTo: string;
}

const THEMES: Record<ThemeId, { label: string; colors: ThemeColors }> = {
  heaven: {
    label: "Heaven",
    colors: {
      background: "#07050d",
      backgroundElevated: "#110c1e",
      foreground: "#f3f0fb",
      muted: "#9c93b5",
      border: "#241c38",
      accent: "#a855f7",
      accentSoft: "#a855f71a",
      casinoFrom: "#c084fc",
      casinoTo: "#ec4899",
    },
  },
  hyper: {
    label: "Hyper",
    colors: {
      background: "#0a0a0a",
      backgroundElevated: "#141414",
      foreground: "#ffffff",
      muted: "#a3a3a3",
      border: "#1f1f1f",
      accent: "#6571FF",
      accentSoft: "#6571ff1a",
      casinoFrom: "#818cf8",
      casinoTo: "#6571FF",
    },
  },
};

const STORAGE_KEY = "hm_site_theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "heaven",
  setTheme: () => {},
  themes: THEMES,
});

function applyTheme(id: ThemeId) {
  const colors = THEMES[id].colors;
  const root = document.documentElement;
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--background-elevated", colors.backgroundElevated);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-soft", colors.accentSoft);
  root.style.setProperty("--casino-from", colors.casinoFrom);
  root.style.setProperty("--casino-to", colors.casinoTo);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("heaven");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && saved in THEMES) {
        setThemeState(saved);
        applyTheme(saved);
      }
    } catch {
      // localStorage unavailable (private mode) — keep default theme
    }
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    applyTheme(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, themes: THEMES }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
