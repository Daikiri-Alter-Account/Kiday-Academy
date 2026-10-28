import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { statusMeta, subjects, type SubjectStatus } from "@/data/mock";

const filters: { value: "todas" | SubjectStatus; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "al-dia", label: "Al día" },
  { value: "pendiente", label: "Pendientes" },
  { value: "atrasada", label: "Atrasadas" },
];

export function SubjectsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todas" | SubjectStatus>("todas");

  const visibleSubjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesFilter = filter === "todas" || subject.status === filter;
      const matchesQuery = subject.name.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Mis materias</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Organiza tus clases, actividades y fechas importantes.</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5">
          <Plus size={16} /> Nueva materia
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative flex w-full max-w-sm items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar materia..."
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/50"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === item.value ? "bg-violet-500/15 text-violet-200" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visibleSubjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleSubjects.map((subject) => {
            const status = statusMeta[subject.status];
            const progress = Math.round((subject.completed / subject.total) * 100);
            return (
              <article key={subject.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-violet-400/25">
                <div className="flex items-start gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${subject.color} text-sm font-bold text-white`}>{subject.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{subject.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{subject.detail}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${status.className}`}>{status.label}</span>
                </div>

                <div className="mt-4 flex items-end justify-between text-xs">
                  <span className="text-[var(--muted)]">Promedio</span>
                  <span className="text-lg font-semibold">
                    {subject.average.toFixed(1)} <span className="text-xs font-normal text-[var(--muted)]">/ 5.0</span>
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-[var(--muted)]">
                    <span>Actividades</span>
                    <span>{subject.completed}/{subject.total}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--track)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
          <p className="text-sm font-medium">No encontramos materias con esos filtros.</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Prueba con otro término o vuelve a ver todas.</p>
        </div>
      )}
    </div>
  );
}
