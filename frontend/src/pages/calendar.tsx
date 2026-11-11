import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListTodo,
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { api, type StudyGroup } from "@/lib/api";
import { parseLocalDate, todayIso, useStudy } from "@/lib/study-store";

type CalendarEvent = {
  id: string;
  kind: "task" | "session";
  title: string;
  subtitle: string;
  date: string;
  startsAt?: string;
  done?: boolean;
};

type LoadStatus = "loading" | "ready" | "error";

const monthFormatter = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });
const selectedFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFormatter = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });
const NOTIFIED_KEY = "kiday-notified-events";

function capitalize(value: string) {
  return value.replace(/^\w/, (letter) => letter.toUpperCase());
}

function dateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildMonthDays(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function eventTime(event: CalendarEvent) {
  return event.startsAt ? timeFormatter.format(new Date(event.startsAt)) : "Todo el día";
}

function eventSortValue(event: CalendarEvent) {
  return event.startsAt
    ? new Date(event.startsAt).getTime()
    : parseLocalDate(event.date).getTime() + 23 * 60 * 60 * 1000;
}

export function CalendarPage() {
  const { subjects, tasks } = useStudy();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [groupsStatus, setGroupsStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification === "undefined" ? "denied" : Notification.permission,
  );
  const [notice, setNotice] = useState("");

  const loadGroups = useCallback(async () => {
    setGroupsStatus("loading");
    setError("");
    try {
      const result = await api.groups.list();
      setGroups(result.groups);
      setGroupsStatus("ready");
    } catch (loadError) {
      setError(messageFor(loadError, "No pudimos cargar las sesiones de tus grupos."));
      setGroupsStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );

  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;
      list.push({
        id: `task-${task.id}`,
        kind: "task",
        title: task.title,
        subtitle: task.subjectId ? subjectById.get(task.subjectId)?.name ?? "Tarea" : "Sin materia",
        date: task.dueDate,
        done: task.done,
      });
    }

    for (const group of groups) {
      for (const session of group.sessions) {
        list.push({
          id: `session-${session.id}`,
          kind: "session",
          title: session.title,
          subtitle: group.name,
          date: dateKey(new Date(session.startsAt)),
          startsAt: session.startsAt,
        });
      }
    }

    return list.sort((a, b) => eventSortValue(a) - eventSortValue(b));
  }, [groups, subjectById, tasks]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  useEffect(() => {
    if (permission !== "granted") return;

    function checkReminders() {
      const now = Date.now();
      const today = todayIso();
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = dateKey(tomorrowDate);

      const due = events.filter((event) => {
        if (event.done) return false;
        if (event.startsAt) {
          const difference = new Date(event.startsAt).getTime() - now;
          return difference > 0 && difference < 24 * 60 * 60 * 1000;
        }
        return event.date === today || event.date === tomorrow;
      });

      let notified: string[] = [];
      try {
        notified = JSON.parse(window.localStorage.getItem(NOTIFIED_KEY) ?? "[]") as string[];
      } catch {
        notified = [];
      }

      const seen = new Set(notified);
      const fresh = due.filter((event) => !seen.has(event.id));
      if (fresh.length === 0) return;

      for (const event of fresh.slice(0, 3)) {
        try {
          new Notification(event.kind === "task" ? "Tarea próxima" : "Sesión de grupo", {
            body: `${event.title} · ${event.subtitle}`,
            tag: event.id,
          });
          seen.add(event.id);
        } catch {
          break;
        }
      }

      try {
        window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...seen].slice(-200)));
      } catch {
        // Si el navegador bloquea el almacenamiento, los recordatorios siguen funcionando.
      }
    }

    checkReminders();
    const timer = window.setInterval(checkReminders, 60_000);
    return () => window.clearInterval(timer);
  }, [events, permission]);

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setNotice("Tu navegador no permite notificaciones.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    setNotice(
      result === "granted"
        ? "Recordatorios activados mientras la app esté abierta."
        : "No se activaron las notificaciones. Puedes habilitarlas desde el navegador.",
    );
  }

  function goMonth(offset: number) {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1);
    setMonthDate(next);
    setSelectedDate(dateKey(next));
  }

  function goToday() {
    const today = new Date();
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayIso());
  }

  const monthDays = buildMonthDays(monthDate);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
  const monthEvents = events.filter((event) => event.date.startsWith(monthKey));
  const monthTasks = monthEvents.filter((event) => event.kind === "task" && !event.done).length;
  const monthSessions = monthEvents.filter((event) => event.kind === "session").length;
  const upcoming = events
    .filter((event) => !event.done && event.date >= todayIso())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Calendario</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tareas, entregas y sesiones de tus grupos en una sola vista.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void enableNotifications()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
          >
            {permission === "granted" ? <BellRing size={16} className="text-emerald-300" /> : <Bell size={16} />}
            {permission === "granted" ? "Recordatorios activos" : "Activar recordatorios"}
          </button>
          <Link
            to="/app/tareas"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5"
          >
            <Plus size={16} /> Nueva tarea
          </Link>
        </div>
      </div>

      {notice && (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--muted)]">
          {notice}
        </p>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadGroups()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-2.5 py-1.5 font-medium transition hover:bg-rose-500/10"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Tareas pendientes del mes</p>
          <p className="mt-2 text-2xl font-semibold">{monthTasks}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Sesiones de grupo</p>
          <p className="mt-2 text-2xl font-semibold">{monthSessions}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Eventos del mes</p>
          <p className="mt-2 text-2xl font-semibold">{monthEvents.length}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{capitalize(monthFormatter.format(monthDate))}</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                aria-label="Mes anterior"
                className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="h-8 rounded-lg border border-[var(--border)] px-2.5 text-[11px] font-medium text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => goMonth(1)}
                aria-label="Mes siguiente"
                className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[9px] font-medium uppercase tracking-wider text-[var(--muted)]">
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const key = dateKey(day);
              const dayEvents = eventsByDate.get(key) ?? [];
              const inMonth = day.getMonth() === monthDate.getMonth();
              const isToday = key === todayIso();
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedDate(key);
                    if (!inMonth) setMonthDate(new Date(day.getFullYear(), day.getMonth(), 1));
                  }}
                  aria-label={`${selectedFormatter.format(day)}, ${dayEvents.length} eventos`}
                  aria-pressed={isSelected}
                  className={`min-h-16 rounded-lg border p-1 text-left transition sm:min-h-24 ${
                    isSelected
                      ? "border-violet-400/50 bg-violet-500/10"
                      : "border-transparent hover:border-[var(--border)] hover:bg-white/[0.03]"
                  } ${inMonth ? "" : "opacity-45"}`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full text-[10px] font-medium ${
                      isToday ? "bg-violet-500 text-white" : "text-[var(--muted)]"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span className="mt-1 hidden space-y-0.5 sm:block">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className={`block truncate rounded px-1 py-0.5 text-[9px] ${
                          event.kind === "session"
                            ? "bg-sky-400/10 text-sky-300"
                            : event.done
                              ? "bg-white/5 text-[var(--muted)] line-through"
                              : "bg-violet-400/10 text-violet-200"
                        }`}
                      >
                        {event.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="block px-1 text-[9px] text-[var(--muted)]">+{dayEvents.length - 2}</span>
                    )}
                  </span>
                  <span className="mt-1 flex gap-0.5 sm:hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={`size-1.5 rounded-full ${
                          event.kind === "session" ? "bg-sky-400" : "bg-violet-400"
                        }`}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-semibold">{capitalize(selectedFormatter.format(parseLocalDate(selectedDate)))}</h4>
              <span className="text-[10px] text-[var(--muted)]">
                {selectedEvents.length} {selectedEvents.length === 1 ? "evento" : "eventos"}
              </span>
            </div>

            {selectedEvents.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {selectedEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-black/10 p-3">
                    <span
                      className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                        event.kind === "session"
                          ? "bg-sky-400/10 text-sky-300"
                          : "bg-violet-400/10 text-violet-200"
                      }`}
                    >
                      {event.kind === "session" ? <UsersRound size={15} /> : <ListTodo size={15} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${event.done ? "text-[var(--muted)] line-through" : ""}`}>
                        {event.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{event.subtitle}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[9px] text-[var(--muted)]">
                      {eventTime(event)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-[11px] text-[var(--muted)]">
                No hay eventos para este día.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Próximos eventos</h3>
              <CalendarDays size={16} className="text-[var(--muted)]" />
            </div>

            {groupsStatus === "loading" ? (
              <div className="mt-4 space-y-2">
                <div className="h-14 animate-pulse rounded-xl bg-white/5" />
                <div className="h-14 animate-pulse rounded-xl bg-white/5" />
                <div className="h-14 animate-pulse rounded-xl bg-white/5" />
              </div>
            ) : upcoming.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {upcoming.map((event) => (
                  <li key={event.id} className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-black/10 p-2.5">
                    <span
                      className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${
                        event.kind === "session"
                          ? "bg-sky-400/10 text-sky-300"
                          : "bg-violet-400/10 text-violet-200"
                      }`}
                    >
                      {event.kind === "session" ? <UsersRound size={13} /> : <ListTodo size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{event.title}</p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">
                        {event.subtitle} · {event.date}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[9px] text-[var(--muted)]">
                      <Clock3 size={10} /> {eventTime(event)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-[11px] text-[var(--muted)]">
                No tienes eventos próximos.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.12] to-indigo-500/[0.05] p-4 sm:p-5">
            <h3 className="text-xs font-semibold">Recordatorios</h3>
            <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
              Activa las notificaciones para recibir avisos de tareas y sesiones durante las próximas 24 horas
              mientras la app esté abierta.
            </p>
            <button
              type="button"
              onClick={() => void enableNotifications()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-[11px] font-medium text-violet-200 transition hover:bg-violet-500/20"
            >
              {permission === "granted" ? <BellRing size={13} /> : <Bell size={13} />}
              {permission === "granted" ? "Notificaciones activas" : "Activar notificaciones"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
