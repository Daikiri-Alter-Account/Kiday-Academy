import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <div className="mr-1">
            <ThemeToggle />
          </div>
          <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)]">
            Iniciar sesión
          </Link>
          <Link to="/registro" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:shadow-violet-900/50">
            Empezar gratis <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-10 place-items-center rounded-xl border border-[var(--border)] text-[var(--foreground)] transition hover:bg-white/5 md:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <nav aria-label="Navegación móvil" className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]">
                {link.label}
              </a>
            ))}
            <div className="mt-2 border-t border-[var(--border)] pt-4">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Tema</p>
              <div className="mb-3">
                <ThemeToggle />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-xl border border-[var(--border)] px-3 py-3 text-center text-sm font-medium text-[var(--foreground)]">Iniciar sesión</Link>
                <Link to="/registro" onClick={() => setMenuOpen(false)} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-3 text-center text-sm font-semibold text-white">Empezar gratis</Link>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
