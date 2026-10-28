import { Moon, Sun, SwatchBook } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";

const options: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: "dark", label: "Negro", icon: Moon },
  { value: "light", label: "Blanco", icon: Sun },
  { value: "violet", label: "Azul violeta", icon: SwatchBook },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-xl border border-[var(--border)] bg-white/[0.03] p-1" role="group" aria-label="Cambiar tema">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={`Tema ${label}`}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={`grid size-8 place-items-center rounded-lg transition ${theme === value ? "bg-violet-500/20 text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
