import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  LibraryBig,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  RefreshCw,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { PlanIcon } from "@/components/plan-icon";
import { SkipLink } from "@/components/skip-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { getPlanMeta, hasCapability } from "@/lib/plans";
import { useStudy } from "@/lib/study-store";

type SidebarLink = {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  requires?: string;
};

const primaryLinks: SidebarLink[] = [
  { label: "Panel principal", to: "/app", icon: LayoutDashboard, end: true },
  { label: "Mis materias", to: "/app/materias", icon: BookOpen },
  { label: "Tareas", to: "/app/tareas", icon: ListTodo },
  { label: "Calendario", to: "/app/calendario", icon: CalendarDays },
  { label: "Grupos de estudio", to: "/app/grupos", icon: UsersRound, requires: "groups" },
];

const toolLinks: SidebarLink[] = [
  { label: "Asistente IA", to: "/app/asistente", icon: Sparkles, requires: "assistant" },
  { label: "Promediador", to: "/app/promediador", icon: GraduationCap },
  { label: "Materiales", to: "/app/materiales", icon: LibraryBig, requires: "materials" },
];

const titles: Record<string, string> = {
  "/app": "Panel principal",
  "/app/materias": "Mis materias",
  "/app/tareas": "Tareas y recordatorios",
  "/app/calendario": "Calendario",
  "/app/grupos": "Grupos de estudio",
  "/app/asistente": "Asistente IA",
  "/app/promediador": "Promediador",
  "/app/materiales": "Biblioteca de materiales",
  "/app/planes": "Planes",
};

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
    isActive
      ? "bg-violet-500/10 font-medium text-[var(--accent)]"
      : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--foreground)]"
  }`;
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const plan = getPlanMeta(user?.plan);

  return (
    <div className="flex h-full flex-col">
      <Brand to="/app" onClick={onNavigate} />

      <nav className="mt-8 flex-1 space-y-7" aria-label="Navegación de la aplicación">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Mi espacio</p>
          <div className="space-y-1">
            {primaryLinks.map(({ label, to, icon: Icon, end, requires }) => {
              const locked = requires ? !hasCapability(user, requires) : false;
              return (
                <NavLink key={to} to={to} end={end} onClick={onNavigate} className={navClass}>
                  <Icon size={16} />
                  {label}
                  {locked && <LockKeyhole size={11} className="ml-auto text-slate-600" aria-label="Requiere un plan superior" />}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Herramientas</p>
          <div className="space-y-1">
            {toolLinks.map(({ label, to, icon: Icon, requires }) => {
              const locked = requires ? !hasCapability(user, requires) : false;
              return (
                <NavLink key={to} to={to} onClick={onNavigate} className={navClass}>
                  <Icon size={16} />
                  {label}
                  {locked && <LockKeyhole size={11} className="ml-auto text-slate-600" aria-label="Requiere un plan superior" />}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="space-y-3">
        <div className={`rounded-xl border p-3 ${plan.cardClass}`}>
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] p-1">
              <PlanIcon service={{ slug: plan.slug }} className="size-full" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold">{plan.name}</p>
              <p className="truncate text-[10px] text-[var(--muted)]">{plan.sidebarTagline}</p>
            </div>
          </div>
          {plan.slug === "kiday-academy" ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                <BadgeCheck size={12} /> Todo desbloqueado
              </p>
              <Link
                to="/app/planes"
                onClick={onNavigate}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] hover:underline"
              >
                Ver plan <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <Link
              to="/app/planes"
              onClick={onNavigate}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] hover:underline"
            >
              Mejorar plan <ChevronRight size={12} />
            </Link>
          )}
        </div>
        <NavLink to="/" className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]">
          <ChevronLeft size={14} /> Volver al inicio
        </NavLink>
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const plan = getPlanMeta(user?.plan);
  const { status: workspaceStatus, error: workspaceError, reload } = useStudy();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] ?? "Panel principal";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    document.title = `${title} | Kiday Studio`;
  }, [title]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <SkipLink target="contenido-app" />
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-sidebar)] p-4 md:block">
        <SidebarNav />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative flex h-full w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface-sidebar)] p-4">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
            >
              <X size={18} />
            </button>
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--foreground)] md:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Kiday Studio</p>
              <h1 className="truncate text-sm font-semibold">{title}</h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <button type="button" aria-label="Notificaciones" className="hidden size-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--foreground)] sm:grid">
                <Bell size={16} />
              </button>
              <span className="hidden max-w-32 truncate text-xs font-medium text-[var(--muted)] sm:block">
                {user?.name ?? "Estudiante"}
              </span>
              <span
                title={`Plan ${plan.name}`}
                className={`hidden items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium text-[var(--foreground)] md:inline-flex ${plan.badgeClass}`}
              >
                <PlanIcon service={{ slug: plan.slug }} className="size-4" />
                {plan.shortName}
              </span>
              <span
                title={user?.name ?? "Estudiante"}
                className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-[11px] font-semibold text-white"
              >
                {initials(user?.name ?? "Estudiante")}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="grid size-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main id="contenido-app" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {workspaceStatus === "error" && (
            <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 text-sm sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-rose-200">No pudimos sincronizar tu espacio</p>
                <p className="mt-0.5 text-xs text-rose-200/70">{workspaceError}</p>
              </div>
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-300/20 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-400/10"
              >
                <RefreshCw size={13} /> Reintentar
              </button>
            </div>
          )}
          {workspaceStatus === "loading" && (
            <div role="status" className="mb-4 flex items-center gap-2 text-xs text-[var(--muted)]">
              <Loader2 size={13} className="animate-spin" /> Sincronizando tu espacio...
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
