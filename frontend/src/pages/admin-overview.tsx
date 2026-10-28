import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Inbox,
  Mail,
  Package,
  RefreshCw,
  UserRound,
  UsersRound,
} from "lucide-react";
import { MessageStatusBadge } from "@/components/message-status";
import { api, type AdminStats, type ContactMessage } from "@/lib/api";

const statCards = [
  { key: "messages", label: "Mensajes totales", icon: Inbox, tone: "bg-violet-500/10 text-violet-300" },
  { key: "newMessages", label: "Sin leer", icon: Mail, tone: "bg-amber-500/10 text-amber-300" },
  { key: "services", label: "Planes activos", icon: Package, tone: "bg-emerald-500/10 text-emerald-300" },
  { key: "students", label: "Estudiantes", icon: UsersRound, tone: "bg-sky-500/10 text-sky-300" },
] as const;

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const [statsResult, messagesResult] = await Promise.all([
        api.admin.stats(),
        api.admin.messages(),
      ]);
      setStats(statsResult);
      setMessages(messagesResult.messages.slice(0, 5));
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar el resumen.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    );
  }

  if (status === "error" || !stats) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-6 text-center">
        <p className="text-sm font-medium">No pudimos cargar el panel.</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium transition hover:bg-white/5"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Resumen general</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">El estado actual de Kiday Academy de un vistazo.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              {label}
              <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{stats[key]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Últimos mensajes</h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">Consultas recibidas desde el formulario.</p>
            </div>
            <Link to="/admin/mensajes" className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:underline">
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>

          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
              <Inbox size={22} className="mx-auto text-[var(--muted)]" />
              <p className="mt-2 text-xs font-medium">Todavía no hay mensajes.</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">Los envíos del formulario aparecerán aquí.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {messages.map((message) => (
                <li key={message.id}>
                  <Link
                    to="/admin/mensajes"
                    className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-black/10 p-3 transition hover:border-violet-400/30"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-violet-500/10 text-[10px] font-semibold text-[var(--accent)]">
                      {message.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium">{message.subject}</span>
                        <MessageStatusBadge status={message.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">
                        {message.name} · {message.email}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{message.message}</span>
                    </span>
                    <span className="hidden shrink-0 text-[10px] text-[var(--muted)] sm:block">
                      {dateFormatter.format(new Date(message.createdAt))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <h3 className="text-sm font-semibold">Acciones rápidas</h3>
            <div className="mt-3 space-y-2">
              <Link to="/admin/mensajes" className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-xs transition hover:border-violet-400/30 hover:bg-violet-500/[0.06]">
                <span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-300"><Mail size={15} /></span>
                <span className="flex-1"><span className="block font-medium">Revisar mensajes</span><span className="text-[10px] text-[var(--muted)]">{stats.newMessages} sin leer</span></span>
                <ArrowRight size={14} className="text-[var(--muted)]" />
              </Link>
              <Link to="/admin/servicios" className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-xs transition hover:border-violet-400/30 hover:bg-violet-500/[0.06]">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-300"><Package size={15} /></span>
                <span className="flex-1"><span className="block font-medium">Editar catálogo</span><span className="text-[10px] text-[var(--muted)]">{stats.services} planes activos</span></span>
                <ArrowRight size={14} className="text-[var(--muted)]" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.1] to-indigo-500/[0.04] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <UserRound size={14} /> Sesión de administrador
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-[var(--muted)]">
              Los cambios que hagas en el catálogo se reflejan de inmediato en la página principal.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
