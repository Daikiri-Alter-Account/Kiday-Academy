import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Flame, GraduationCap, Plus, Sparkles } from "lucide-react";
import { stats, statusMeta, subjects, week, type StatTone } from "@/data/mock";

const statIcons = { average: GraduationCap, hours: Clock3, streak: Flame } as const;

const statTones: Record<StatTone, string> = {
  emerald: "bg-emerald-400/10 text-emerald-400",
  blue: "bg-blue-400/10 text-blue-400",
  amber: "bg-amber-400/10 text-amber-400",
};

const today = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
const dateLabel = today.charAt(0).toUpperCase() + today.slice(1);
const maxHours = Math.max(...week.map((day) => day.hours));

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--muted)]">{dateLabel}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">¡Hola, estudiante! <span aria-hidden="true">👋</span></h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Este es tu resumen para hoy.</p>
        </div>
        <Link to="/app/materias" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5">
          <Plus size={16} /> Nueva materia
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = statIcons[stat.id];
          return (
            <div key={stat.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                {stat.label}
                <span className={`grid size-8 place-items-center rounded-lg ${statTones[stat.tone]}`}>
                  <Icon size={16} />
                </span>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight">
                {stat.value}
                <span className="ml-1 text-sm font-normal text-[var(--muted)]">{stat.suffix}</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--muted)]">{stat.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Tus materias</h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">Mantén todo bajo control</p>
            </div>
            <Link to="/app/materias" className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:text-violet-200">
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {subjects.slice(0, 3).map((subject) => {
              const status = statusMeta[subject.status];
              return (
                <Link key={subject.id} to="/app/materias" className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/10 p-2.5 transition hover:border-violet-400/30 hover:bg-violet-500/[0.06]">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${subject.color} text-xs font-bold text-white`}>{subject.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium sm:text-sm">{subject.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{subject.detail}</span>
                  </span>
                  <span className={`hidden rounded-full px-2 py-1 text-[10px] sm:block ${status.className}`}>{status.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tu semana</h3>
            <span className="text-[10px] text-[var(--muted)]">Últimos 7 días</span>
          </div>
          <div className="mt-5 flex h-24 items-end justify-between gap-2 px-1">
            {week.map((day) => (
              <div key={day.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${day.hours} h`}>
                <div
                  className={`w-full max-w-6 rounded-t-md ${day.hours === maxHours ? "bg-gradient-to-t from-violet-700 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.25)]" : "bg-violet-400/20"}`}
                  style={{ height: `${day.height}%` }}
                />
                <span className="text-[9px] text-[var(--muted)]">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[11px]">
            <span className="text-[var(--muted)]">Meta semanal</span>
            <span>12.5 <span className="text-[var(--muted)]">/ 15 h</span></span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--track)]">
            <div className="h-full w-[83%] rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" />
          </div>
        </section>
      </div>

      <Link to="/app/asistente" className="flex items-center gap-3 rounded-2xl border border-violet-400/15 bg-gradient-to-r from-violet-500/[0.1] to-indigo-500/[0.05] px-4 py-3.5 transition hover:border-violet-400/30">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-[var(--accent)]">
          <Sparkles size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Tu siguiente parcial es Cálculo diferencial.</span>
          <span className="block text-xs text-[var(--muted)]">¿Repasamos juntos con Kiday IA?</span>
        </span>
        <ArrowRight size={16} className="shrink-0 text-[var(--accent)]" />
      </Link>
    </div>
  );
}
