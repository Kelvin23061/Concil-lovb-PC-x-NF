import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "light" | "dark";

const ThemeContext = createContext<{ tema: Tema; alternar: () => void }>({
  tema: "dark",
  alternar: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    const salvo = window.localStorage.getItem("tema");
    const inicial: Tema = salvo === "light" || salvo === "dark" ? salvo : "dark";
    setTema(inicial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    document.documentElement.style.colorScheme = tema;
  }, [tema]);

  const alternar = () => {
    setTema((atual) => {
      const proximo: Tema = atual === "dark" ? "light" : "dark";
      window.localStorage.setItem("tema", proximo);
      return proximo;
    });
  };

  return <ThemeContext.Provider value={{ tema, alternar }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
