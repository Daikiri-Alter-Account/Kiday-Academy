import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Circle,
  GraduationCap,
  ListTodo,
  Plus,
  Sparkles,
} from "lucide-react";
import { statusMeta } from "@/data/mock";
import { useAuth } from "@/lib/auth-context";
import { useGreeting } from "@/lib/greeting";
import { dueInfo, todayIso, useStudy } from "@/lib/study-store";

const dateLabel = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
})
  .format(new Date())
  .replace(/^\w/, (letter) => letter.toUpperCase());

const statTones = {
  emerald: "bg-emerald-400/10 text-emerald-400",
  blue: "bg-blue-400/10 text-blue-400",
  amber: "bg-amber-400/10 text-amber-400",
  rose: "bg-rose-400/10 text-rose-300",
} as const;

export function DashboardPage() {
  const { user } = useAuth();
  const greeting = useGreeting();
  const firstName = user?.firstName?.trim() || user?.name?.split(/\s+/)[0] || "estudiante";
  const { subjects, tasks, toggleTask, addTask } = useStudy();

  const pendingTasks = tasks
    .filter((task) => !task.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const overdue = pendingTasks.filter((task) => task.dueDate < todayIso()).length;
  const average = subjects.length
    ? subjects.reduce((sum, subject) => sum + subject.average, 0) / subjects.length
    : 0;
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  const stats = [
    {
      id: "average",
      label: "Promedio actual",
      value: average.toFixed(1),
      suffix: "/ 5.0",
      hint: `${subjects.length} ${subjects.length === 1 ? "materia registrada" : "materias registradas"}`,
      tone: "emerald" as const,
      icon: GraduationCap,
    },
    {
      id: "pending",
      label: "Entregas pendientes",
      value: String(pendingTasks.length),
      suffix: pendingTasks.length === 1 ? "tarea" : "tareas",
      hint: overdue > 0 ? `${overdue} ${overdue === 1 ? "atrasada" : "atrasadas"}` : "Todo al día",
      tone: overdue > 0 ? ("rose" as const) : ("blue" as const),
      icon: ListTodo,
    },
    {
      id: "subjects",
      label: "Materias registradas",
      value: String(subjects.length),
      suffix: subjects.length === 1 ? "materia" : "materias",
      hint: "Este semestre",
      tone: "amber" as const,
      icon: BookOpen,
    },
  ];

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dayTasks = tasks.filter((task) => task.dueDate === iso);
    return {
      iso,
      day: ["D", "L", "M", "X", "J", "V", "S"][date.getDay()],
      dayNumber: date.getDate(),
      count: dayTasks.filter((task) => !task.done).length,
      total: dayTasks.length,
    };
  });
  const maxCount = Math.max(1, ...weekDays.map((day) => day.count));
  const weekPending = weekDays.reduce((sum, day) => sum + day.count, 0);
  const weekTotal = weekDays.reduce((sum, day) => sum + day.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--muted)]">{dateLabel}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {greeting}, {firstName} <span aria-hidden="true">👋</span>
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Este es tu resumen para hoy.</p>
        </div>
        <Link to="/app/materias" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5">
          <Plus size={16} /> Nueva materia
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
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
              <p className={`mt-2 text-[11px] ${stat.tone === "rose" ? "text-rose-300" : "text-[var(--muted)]"}`}>{stat.hint}</p>
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

          {subjects.length > 0 ? (
            <div className="space-y-2">
              {subjects.slice(0, 3).map((subject) => {
                const status = statusMeta[subject.status];
                const pending = tasks.filter((task) => task.subjectId === subject.id && !task.done).length;
                return (
                  <Link key={subject.id} to="/app/materias" className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/10 p-2.5 transition hover:border-violet-400/30 hover:bg-violet-500/[0.06]">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${subject.color} text-xs font-bold text-white`}>{subject.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium sm:text-sm">{subject.name}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">
                        {pending > 0 ? `${pending} ${pending === 1 ? "tarea pendiente" : "tareas pendientes"}` : subject.detail}
                      </span>
                    </span>
                    <span className={`hidden rounded-full px-2 py-1 text-[10px] sm:block ${status.className}`}>{status.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-xs font-medium">Aún no tienes materias.</p>
              <Link to="/app/materias" className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline">
                Crear mi primera materia <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tu semana</h3>
            <span className="text-[10px] text-[var(--muted)]">Próximos 7 días</span>
          </div>
          <div className="mt-5 flex h-24 items-end justify-between gap-2 px-1">
            {weekDays.map((day) => {
              const height = day.count === 0 ? 4 : Math.max(14, Math.round((day.count / maxCount) * 100));
              const isToday = day.iso === todayIso();
              return (
                <div key={day.iso} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${day.count} ${day.count === 1 ? "entrega" : "entregas"}`}>
                  <div
                    className={`w-full max-w-6 rounded-t-md ${
                      day.count === 0
                        ? "bg-violet-400/10"
                        : isToday
                          ? "bg-gradient-to-t from-violet-700 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.25)]"
                          : "bg-violet-400/30"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className={`text-[9px] ${isToday ? "font-semibold text-[var(--accent)]" : "text-[var(--muted)]"}`}>{day.day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[11px]">
            <span className="text-[var(--muted)]">Entregas pendientes</span>
            <span>{weekPending} <span className="text-[var(--muted)]">/ {weekTotal} esta semana</span></span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--track)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all"
              style={{ width: `${weekTotal > 0 ? Math.round(((weekTotal - weekPending) / weekTotal) * 100) : 0}%` }}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Próximas entregas</h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">Lo que necesita tu atención</p>
          </div>
          <Link to="/app/tareas" className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:text-violet-200">
            Ver todas <ArrowRight size={13} />
          </Link>
        </div>

        {pendingTasks.length > 0 ? (
          <ul className="divide-y divide-[var(--border)]">
            {pendingTasks.slice(0, 4).map((task) => {
              const subject = task.subjectId ? subjectById.get(task.subjectId) : undefined;
              const due = dueInfo(task.dueDate, task.done);
              return (
                <li key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-label={`Completar ${task.title}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-emerald-400/40 hover:text-emerald-300"
                  >
                    <Circle size={14} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium sm:text-sm">{task.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{subject?.name ?? "Sin materia"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${due.className}`}>{due.label}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium">
              <Check size={14} className="text-emerald-300" /> No tienes entregas pendientes.
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Aprovecha para repasar o adelantar un tema.</p>
            <button
              type="button"
              onClick={() =>
                addTask({
                  title: "Repasar apuntes de la semana",
                  subjectId: subjects[0]?.id ?? null,
                  dueDate: todayIso(),
                  priority: "media",
                })
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-medium transition hover:border-violet-400/30 hover:text-[var(--accent)]"
            >
              <Plus size={12} /> Agregar recordatorio
            </button>
          </div>
        )}
      </section>

      <Link to="/app/asistente" className="flex items-center gap-3 rounded-2xl border border-violet-400/15 bg-gradient-to-r from-violet-500/[0.1] to-indigo-500/[0.05] px-4 py-3.5 transition hover:border-violet-400/30">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-[var(--accent)]">
          <Sparkles size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">¿Repasamos para tu próxima entrega?</span>
          <span className="block text-xs text-[var(--muted)]">Kiday IA puede explicarte el tema paso a paso.</span>
        </span>
        <ArrowRight size={16} className="shrink-0 text-[var(--accent)]" />
      </Link>
    </div>
  );
}
