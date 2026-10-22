"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Atom, Menu, Moon, Sun, SwatchBook, X } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Contacto", href: "#contacto" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: typeof Moon }[] = [
    { value: "dark", label: "Negro", icon: Moon },
    { value: "light", label: "Blanco", icon: Sun },
    { value: "violet", label: "Azul violeta", icon: SwatchBook },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="#inicio" className="flex items-center gap-2.5" aria-label="Kiday Studio, inicio">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-950/50">
            <Atom size={20} strokeWidth={2.2} />
          </span>
          <span className="bg-gradient-to-r from-[var(--foreground)] via-violet-300 to-indigo-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">
            Kiday Studio
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <div className="mr-1 flex items-center rounded-xl border border-[var(--border)] bg-white/[0.03] p-1" aria-label="Cambiar tema">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" title={label} aria-label={`Tema ${label}`} aria-pressed={theme === value} onClick={() => setTheme(value)} className={`grid size-8 place-items-center rounded-lg transition ${theme === value ? "bg-violet-500/20 text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <Link href="#iniciar-sesion" className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)]">
            Iniciar sesión
          </Link>
          <Link href="#registro" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:shadow-violet-900/50">
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
              <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]">
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-[var(--border)] pt-4">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Tema</p>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {themeOptions.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => setTheme(value)} className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs ${theme === value ? "border-violet-400/40 bg-violet-500/15 text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}><Icon size={13} />{label}</button>)}
              </div>
              <div className="grid grid-cols-2 gap-2">
              <Link href="#iniciar-sesion" onClick={() => setMenuOpen(false)} className="rounded-xl border border-[var(--border)] px-3 py-3 text-center text-sm font-medium text-[var(--foreground)]">Iniciar sesión</Link>
              <Link href="#registro" onClick={() => setMenuOpen(false)} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-3 text-center text-sm font-semibold text-white">Empezar gratis</Link>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
