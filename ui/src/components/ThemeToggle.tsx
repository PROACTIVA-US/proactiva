import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/useTheme";

interface ThemeToggleProps {
  /** "floating" renders a pill in the top-right corner for wildvine pages. */
  variant?: "inline" | "floating";
}

export function ThemeToggle({ variant = "inline" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const nextLabel = theme === "dark" ? "Light" : "Dark";
  const Icon = theme === "dark" ? Sun : Moon;

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed top-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        }}
        title={`Switch to ${nextLabel.toLowerCase()} theme`}
      >
        <Icon className="h-3.5 w-3.5" />
        {nextLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border bg-card text-foreground hover:bg-accent transition-colors"
      title={`Switch to ${nextLabel.toLowerCase()} theme`}
    >
      <Icon className="h-4 w-4" />
      {nextLabel} theme
    </button>
  );
}
