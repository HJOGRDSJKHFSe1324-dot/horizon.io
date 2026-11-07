"use client";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };
const ThemeContext = createContext<Ctx>({ theme: "dark", setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => {
    const saved = (localStorage.getItem("horizon-theme") as Theme | null);
    const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const initial = saved || system;
    setThemeState(initial);
    document.documentElement.classList.toggle("light", initial === "light");
  }, []);
  function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.classList.toggle("light", t === "light");
    localStorage.setItem("horizon-theme", t);
  }
  return <ThemeContext.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }