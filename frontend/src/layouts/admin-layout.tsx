import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";

const adminLinks = [
  { label: "Resumen", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Mensajes", to: "/admin/mensajes", icon: Inbox },
  { label: "Planes y servicios", to: "/admin/servicios", icon: Package },
];

const titles: Record<string, string> = {
  "/admin": "Resumen",
  "/admin/mensajes": "Mensajes",
  "/admin/servicios": "Planes y servicios",
};

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
    isActive
      ? "bg-violet-500/10 font-medium text-[var(--accent)]"
      : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--foreground)]"
  }`;
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Brand to="/admin" onClick={onNavigate} />
      <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        Administración
      </p>
      <nav className="space-y-1" aria-label="Navegación de administración">
        {adminLinks.map(({ label, to, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={navClass}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-[var(--border)] pt-4">
        <NavLink to="/app" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]">
          <ArrowUpRight size={14} /> Ir a la app
        </NavLink>
        <NavLink to="/" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]">
          <ArrowUpRight size={14} /> Volver al sitio
        </NavLink>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = titles[location.pathname] ?? "Administración";

  useEffect(() => {
    document.title = `${title} | Admin · Kiday Studio`;
  }, [title]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-sidebar)] p-4 md:block">
        <AdminNav />
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
            <AdminNav onNavigate={() => setMenuOpen(false)} />
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
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Kiday Studio · Admin</p>
              <h1 className="truncate text-sm font-semibold">{title}</h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="mr-1 hidden text-right sm:block">
                <p className="text-xs font-medium">{user?.name}</p>
                <p className="text-[10px] text-[var(--muted)]">{user?.email}</p>
              </div>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="grid size-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-rose-400/40 hover:text-rose-300"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
