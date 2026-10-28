import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { statusMeta, type Subject, type SubjectStatus } from "@/data/mock";
import { useStudy, type SubjectDraft } from "@/lib/study-store";

const filters: { value: "todas" | SubjectStatus; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "al-dia", label: "Al día" },
  { value: "pendiente", label: "Pendientes" },
  { value: "atrasada", label: "Atrasadas" },
];

type Editor = { mode: "create" } | { mode: "edit"; subject: Subject } | null;

function SubjectForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Subject;
  onSubmit: (draft: SubjectDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [average, setAverage] = useState(String(initial?.average ?? 0));
  const [completed, setCompleted] = useState(String(initial?.completed ?? 0));
  const [total, setTotal] = useState(String(initial?.total ?? 1));
  const [status, setStatus] = useState<SubjectStatus>(initial?.status ?? "pendiente");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const numericAverage = Number(average);
    const numericCompleted = Number(completed);
    const numericTotal = Number(total);

    if (!trimmedName) {
      setError("Escribe el nombre de la materia.");
      return;
    }
    if (!Number.isFinite(numericAverage) || numericAverage < 0 || numericAverage > 5) {
      setError("El promedio debe estar entre 0.0 y 5.0.");
      return;
    }
    if (!Number.isInteger(numericTotal) || numericTotal < 1) {
      setError("El total de actividades debe ser un entero mayor que cero.");
      return;
    }
    if (!Number.isInteger(numericCompleted) || numericCompleted < 0 || numericCompleted > numericTotal) {
      setError("Las actividades completadas deben estar entre 0 y el total.");
      return;
    }

    onSubmit({
      name: trimmedName,
      detail: detail.trim() || "Sin detalle",
      average: Math.round(numericAverage * 10) / 10,
      completed: numericCompleted,
      total: numericTotal,
      status,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="subject-name" className="mb-1.5 block text-xs font-medium">
          Nombre de la materia
        </label>
        <input
          id="subject-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder="Ej. Cálculo diferencial"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      <div>
        <label htmlFor="subject-detail" className="mb-1.5 block text-xs font-medium">
          Detalle <span className="font-normal text-[var(--muted)]">(opcional)</span>
        </label>
        <input
          id="subject-detail"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          maxLength={80}
          placeholder="Ej. Parcial 2 · 4 actividades"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="subject-average" className="mb-1.5 block text-xs font-medium">
            Promedio
          </label>
          <input
            id="subject-average"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={average}
            onChange={(event) => setAverage(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          />
        </div>
        <div>
          <label htmlFor="subject-completed" className="mb-1.5 block text-xs font-medium">
            Completadas
          </label>
          <input
            id="subject-completed"
            type="number"
            min={0}
            step={1}
            value={completed}
            onChange={(event) => setCompleted(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          />
        </div>
        <div>
          <label htmlFor="subject-total" className="mb-1.5 block text-xs font-medium">
            Total
          </label>
          <input
            id="subject-total"
            type="number"
            min={1}
            step={1}
            value={total}
            onChange={(event) => setTotal(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject-status" className="mb-1.5 block text-xs font-medium">
          Estado
        </label>
        <select
          id="subject-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as SubjectStatus)}
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        >
          <option value="al-dia">Al día</option>
          <option value="pendiente">Pendiente</option>
          <option value="atrasada">Atrasada</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-[var(--border)] px-4 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="h-10 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-semibold text-white transition hover:brightness-110"
        >
          {initial ? "Guardar cambios" : "Crear materia"}
        </button>
      </div>
    </form>
  );
}

export function SubjectsPage() {
  const { subjects, tasks, addSubject, updateSubject, deleteSubject } = useStudy();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todas" | SubjectStatus>("todas");
  const [editor, setEditor] = useState<Editor>(null);

  const visibleSubjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesFilter = filter === "todas" || subject.status === filter;
      const matchesQuery = subject.name.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, subjects]);

  function handleDelete(subject: Subject) {
    const subjectTasks = tasks.filter((task) => task.subjectId === subject.id).length;
    const extra = subjectTasks > 0 ? ` También se eliminarán ${subjectTasks} tareas asociadas.` : "";
    if (window.confirm(`¿Eliminar "${subject.name}"?${extra}`)) {
      deleteSubject(subject.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Mis materias</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Organiza tus clases, actividades y fechas importantes.</p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">Tus cambios se guardan en este navegador.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: "create" })}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5"
        >
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
            const progress = subject.total > 0 ? Math.round((subject.completed / subject.total) * 100) : 0;
            const pendingTasks = tasks.filter((task) => task.subjectId === subject.id && !task.done).length;

            return (
              <article key={subject.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-violet-400/25">
                <div className="flex items-start gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${subject.color} text-sm font-bold text-white`}>{subject.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{subject.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{subject.detail}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditor({ mode: "edit", subject })}
                      aria-label={`Editar ${subject.name}`}
                      className="grid size-7 place-items-center rounded-md text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(subject)}
                      aria-label={`Eliminar ${subject.name}`}
                      className="grid size-7 place-items-center rounded-md text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-1 text-[10px] ${status.className}`}>{status.label}</span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {pendingTasks} {pendingTasks === 1 ? "tarea pendiente" : "tareas pendientes"}
                  </span>
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
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
          <p className="text-sm font-medium">
            {subjects.length === 0 ? "Aún no tienes materias." : "No encontramos materias con esos filtros."}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {subjects.length === 0 ? "Crea tu primera materia para empezar a organizar el semestre." : "Prueba con otro término o vuelve a ver todas."}
          </p>
          {subjects.length === 0 && (
            <button
              type="button"
              onClick={() => setEditor({ mode: "create" })}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white"
            >
              <Plus size={15} /> Crear materia
            </button>
          )}
        </div>
      )}

      <Modal
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Editar materia" : "Nueva materia"}
        description="Registra el nombre, tu promedio y el avance de actividades."
      >
        {editor && (
          <SubjectForm
            initial={editor.mode === "edit" ? editor.subject : undefined}
            onCancel={() => setEditor(null)}
            onSubmit={(draft) => {
              if (editor.mode === "edit") updateSubject(editor.subject.id, draft);
              else addSubject(draft);
              setEditor(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
