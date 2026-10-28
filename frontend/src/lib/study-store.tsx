import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subjects as seedSubjects, type Subject } from "@/data/mock";

export type TaskPriority = "alta" | "media" | "baja";

export type StudyTask = {
  id: string;
  title: string;
  subjectId: string | null;
  dueDate: string;
  priority: TaskPriority;
  done: boolean;
  createdAt: string;
};

export type SubjectDraft = Pick<
  Subject,
  "name" | "detail" | "average" | "completed" | "total" | "status"
>;

export type TaskDraft = Pick<StudyTask, "title" | "subjectId" | "dueDate" | "priority">;

type StudyState = {
  subjects: Subject[];
  tasks: StudyTask[];
};

type StudyContextValue = StudyState & {
  addSubject: (draft: SubjectDraft) => void;
  updateSubject: (id: string, draft: SubjectDraft) => void;
  deleteSubject: (id: string) => void;
  addTask: (draft: TaskDraft) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
};

const STORAGE_KEY = "kiday-study-workspace-v1";

const colors = [
  "from-violet-500 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-fuchsia-400 to-purple-500",
];

const StudyContext = createContext<StudyContextValue | null>(null);

function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isoDateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function todayIso() {
  return toIso(new Date());
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(
    parseLocalDate(value),
  );
}

export function dueInfo(value: string, done: boolean) {
  if (done) {
    return { label: "Completada", className: "bg-emerald-400/10 text-emerald-300" };
  }

  const difference = Math.round(
    (parseLocalDate(value).getTime() - parseLocalDate(todayIso()).getTime()) / 86_400_000,
  );

  if (difference < 0) {
    return {
      label: difference === -1 ? "Ayer" : `Hace ${Math.abs(difference)} días`,
      className: "bg-rose-400/10 text-rose-300",
    };
  }
  if (difference === 0) return { label: "Hoy", className: "bg-amber-400/10 text-amber-300" };
  if (difference === 1) return { label: "Mañana", className: "bg-amber-400/10 text-amber-300" };
  if (difference <= 7) {
    return { label: `En ${difference} días`, className: "bg-sky-400/10 text-sky-300" };
  }
  return { label: formatDueDate(value), className: "bg-white/5 text-[var(--muted)]" };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function seedTasks(): StudyTask[] {
  return [
    {
      id: "task-calculo",
      title: "Entregar taller de derivadas",
      subjectId: "calculo",
      dueDate: isoDateOffset(1),
      priority: "alta",
      done: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-biologia",
      title: "Repasar para el quiz de la célula",
      subjectId: "biologia",
      dueDate: isoDateOffset(0),
      priority: "alta",
      done: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-historia",
      title: "Avanzar el proyecto de historia",
      subjectId: "historia",
      dueDate: isoDateOffset(3),
      priority: "media",
      done: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-programacion",
      title: "Subir el ejercicio de arreglos",
      subjectId: "programacion",
      dueDate: isoDateOffset(-1),
      priority: "alta",
      done: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-ingles",
      title: "Practicar pronunciación para el oral",
      subjectId: "ingles",
      dueDate: isoDateOffset(5),
      priority: "baja",
      done: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-fisica",
      title: "Leer el capítulo de cinemática",
      subjectId: "fisica",
      dueDate: isoDateOffset(-2),
      priority: "media",
      done: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function seedState(): StudyState {
  return {
    subjects: seedSubjects.map((subject) => ({ ...subject })),
    tasks: seedTasks(),
  };
}

function loadState(): StudyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();

    const parsed = JSON.parse(raw) as Partial<StudyState>;
    if (!Array.isArray(parsed.subjects) || !Array.isArray(parsed.tasks)) return seedState();

    return {
      subjects: parsed.subjects as Subject[],
      tasks: parsed.tasks as StudyTask[],
    };
  } catch {
    return seedState();
  }
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudyState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // El espacio local puede estar bloqueado; la app sigue funcionando en memoria.
    }
  }, [state]);

  function addSubject(draft: SubjectDraft) {
    setState((current) => ({
      ...current,
      subjects: [
        ...current.subjects,
        {
          ...draft,
          id: createId(),
          icon: initials(draft.name),
          color: colors[current.subjects.length % colors.length],
        },
      ],
    }));
  }

  function updateSubject(id: string, draft: SubjectDraft) {
    setState((current) => ({
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.id === id ? { ...subject, ...draft, icon: initials(draft.name) } : subject,
      ),
    }));
  }

  function deleteSubject(id: string) {
    setState((current) => ({
      ...current,
      subjects: current.subjects.filter((subject) => subject.id !== id),
      tasks: current.tasks.filter((task) => task.subjectId !== id),
    }));
  }

  function addTask(draft: TaskDraft) {
    setState((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          ...draft,
          id: createId(),
          done: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }

  function toggleTask(id: string) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    }));
  }

  function deleteTask(id: string) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
    }));
  }

  return (
    <StudyContext.Provider
      value={{ ...state, addSubject, updateSubject, deleteSubject, addTask, toggleTask, deleteTask }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy debe usarse dentro de StudyProvider.");
  return context;
}
