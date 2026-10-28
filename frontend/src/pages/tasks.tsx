import { useMemo, useState, type FormEvent } from "react";
import { Check, Circle, ListTodo, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import type { Subject } from "@/data/mock";
import {
  dueInfo,
  todayIso,
  useStudy,
  type TaskDraft,
  type TaskPriority,
} from "@/lib/study-store";

const filters = [
  { value: "pendientes", label: "Pendientes" },
  { value: "completadas", label: "Completadas" },
  { value: "todas", label: "Todas" },
] as const;

type Filter = (typeof filters)[number]["value"];

const priorityMeta: Record<TaskPriority, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-rose-400/10 text-rose-300" },
  media: { label: "Media", className: "bg-amber-400/10 text-amber-300" },
  baja: { label: "Baja", className: "bg-sky-400/10 text-sky-300" },
};

function TaskForm({
  subjects,
  onSubmit,
  onCancel,
}: {
  subjects: Subject[];
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [dueDate, setDueDate] = useState(todayIso());
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Escribe el nombre de la tarea.");
      return;
    }
    if (!dueDate) {
      setError("Selecciona una fecha de entrega.");
      return;
    }

    onSubmit({
      title: title.trim(),
      subjectId: subjectId || null,
      dueDate,
      priority,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="task-title" className="mb-1.5 block text-xs font-medium">
          Tarea o recordatorio
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          placeholder="Ej. Entregar taller de derivadas"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="task-subject" className="mb-1.5 block text-xs font-medium">
            Materia
          </label>
          <select
            id="task-subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          >
            <option value="">Sin materia</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-date" className="mb-1.5 block text-xs font-medium">
            Fecha de entrega
          </label>
          <input
            id="task-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="task-priority" className="mb-1.5 block text-xs font-medium">
          Prioridad
        </label>
        <select
          id="task-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        >
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
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
          Crear tarea
        </button>
      </div>
    </form>
  );
}

export function TasksPage() {
  const { subjects, tasks, addTask, toggleTask, deleteTask } = useStudy();
  const [filter, setFilter] = useState<Filter>("pendientes");
  const [formOpen, setFormOpen] = useState(false);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );

  const counts = {
    pendientes: tasks.filter((task) => !task.done).length,
    completadas: tasks.filter((task) => task.done).length,
    todas: tasks.length,
  };

  const overdue = tasks.filter(
    (task) => !task.done && task.dueDate < todayIso(),
  ).length;

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (filter === "pendientes") return !task.done;
      if (filter === "completadas") return task.done;
      return true;
    });

    return filtered.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [filter, tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tareas y recordatorios</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Organiza tus entregas y no pierdas una fecha importante.</p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">Tus cambios se guardan en este navegador.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5"
        >
          <Plus size={16} /> Nueva tarea
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Pendientes</p>
          <p className="mt-2 text-2xl font-semibold">{counts.pendientes}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Atrasadas</p>
          <p className={`mt-2 text-2xl font-semibold ${overdue > 0 ? "text-rose-300" : ""}`}>{overdue}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Completadas</p>
          <p className="mt-2 text-2xl font-semibold">{counts.completadas}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 sm:w-fit">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === item.value
                ? "bg-violet-500/15 text-violet-200"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {item.label}
            <span className="ml-1.5 text-[10px] opacity-70">{counts[item.value]}</span>
          </button>
        ))}
      </div>

      {visibleTasks.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <ul className="divide-y divide-[var(--border)]">
            {visibleTasks.map((task) => {
              const subject = task.subjectId ? subjectById.get(task.subjectId) : undefined;
              const due = dueInfo(task.dueDate, task.done);
              const priority = priorityMeta[task.priority];

              return (
                <li key={task.id} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.02] sm:px-5">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-label={task.done ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`}
                    aria-pressed={task.done}
                    className={`grid size-8 shrink-0 place-items-center rounded-full border transition ${
                      task.done
                        ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-violet-400/40 hover:text-[var(--accent)]"
                    }`}
                  >
                    {task.done ? <Check size={15} /> : <Circle size={14} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${task.done ? "text-[var(--muted)] line-through" : "font-medium"}`}>
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--muted)]">
                      {subject ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`size-2 rounded-full bg-gradient-to-br ${subject.color}`} />
                          {subject.name}
                        </span>
                      ) : (
                        <span>Sin materia</span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(`${task.dueDate}T00:00:00`))}</span>
                    </div>
                  </div>

                  <span className={`hidden rounded-full px-2 py-1 text-[10px] sm:inline ${due.className}`}>{due.label}</span>
                  <span className={`hidden rounded-full px-2 py-1 text-[10px] md:inline ${priority.className}`}>{priority.label}</span>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Eliminar ${task.title}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-[var(--accent)]">
            <ListTodo size={22} />
          </span>
          <p className="mt-3 text-sm font-medium">
            {tasks.length === 0 ? "Aún no tienes tareas." : "No hay tareas en este filtro."}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {tasks.length === 0
              ? "Agrega tu primera entrega para empezar a organizarte."
              : "Cambia el filtro o crea una nueva tarea."}
          </p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white"
          >
            <Plus size={15} /> Crear tarea
          </button>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nueva tarea"
        description="Agrega una entrega o recordatorio y asígnalo a una materia."
      >
        {formOpen && (
          <TaskForm
            subjects={subjects}
            onCancel={() => setFormOpen(false)}
            onSubmit={(draft) => {
              addTask(draft);
              setFormOpen(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
