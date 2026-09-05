import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { tema, alternar } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={alternar}
      aria-label={tema === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      title={tema === "dark" ? "Modo claro" : "Modo escuro"}
    >
      {tema === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
