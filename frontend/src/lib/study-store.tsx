import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Subject } from "@/data/mock";
import { api, type TaskPriority, type WorkspaceTask } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export type { TaskPriority };

export type StudyTask = WorkspaceTask;

export type SubjectDraft = Pick<
  Subject,
  "name" | "detail" | "average" | "completed" | "total" | "status"
>;

export type TaskDraft = Pick<StudyTask, "title" | "subjectId" | "dueDate" | "priority">;

type StudyStatus = "loading" | "ready" | "error";

type StudyState = {
  subjects: Subject[];
  tasks: StudyTask[];
};

type StudyContextValue = StudyState & {
  status: StudyStatus;
  error: string;
  reload: () => Promise<void>;
  addSubject: (draft: SubjectDraft) => Promise<void>;
  updateSubject: (id: string, draft: SubjectDraft) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addTask: (draft: TaskDraft) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
};

const STORAGE_KEY = "kiday-study-workspace-v2";
const LEGACY_STORAGE_KEY = "kiday-study-workspace-v1";
const MIGRATION_KEY = "kiday-study-workspace-v2-migrated";

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function storageKeyFor(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

function migrationKeyFor(userId: string) {
  return `${MIGRATION_KEY}:${userId}`;
}

function parseState(raw: string): StudyState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    if (!Array.isArray(parsed.subjects) || !Array.isArray(parsed.tasks)) return null;
    return {
      subjects: parsed.subjects as Subject[],
      tasks: parsed.tasks as StudyTask[],
    };
  } catch {
    return null;
  }
}

function readCache(key: string): StudyState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parseState(raw) : null;
  } catch {
    return null;
  }
}

function initialState(userId: string): StudyState {
  return (
    readCache(storageKeyFor(userId)) ??
    readCache(LEGACY_STORAGE_KEY) ?? {
      subjects: [],
      tasks: [],
    }
  );
}

function hasMigrationFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markMigration(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
  }
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "anon";
  const storageKey = storageKeyFor(userId);
  const migrationKey = migrationKeyFor(userId);
  const [state, setState] = useState<StudyState>(() => initialState(userId));
  const [status, setStatus] = useState<StudyStatus>("loading");
  const [error, setError] = useState("");
  const activeRef = useRef(true);

  const reload = useCallback(async () => {
    if (!user) return;

    setStatus("loading");
    setError("");

    try {
      let workspace = await api.workspace.get();

      if (
        workspace.subjects.length === 0 &&
        workspace.tasks.length === 0 &&
        !hasMigrationFlag(migrationKey)
      ) {
        const cached = readCache(storageKey) ?? readCache(LEGACY_STORAGE_KEY);
        if (cached && (cached.subjects.length > 0 || cached.tasks.length > 0)) {
          workspace = await api.workspace.importWorkspace(cached);
          try {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {
          }
        }
      }

      markMigration(migrationKey);
      if (!activeRef.current) return;
      setState({ subjects: workspace.subjects, tasks: workspace.tasks });
      setStatus("ready");
    } catch (loadError) {
      if (!activeRef.current) return;
      setError(messageFor(loadError, "No pudimos cargar tu espacio de trabajo."));
      setStatus("error");
    }
  }, [migrationKey, storageKey, user]);

  useEffect(() => {
    activeRef.current = true;
    void reload();
    return () => {
      activeRef.current = false;
    };
  }, [reload]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
    }
  }, [state, storageKey]);

  const updateState = useCallback((updater: (current: StudyState) => StudyState) => {
    setState(updater);
  }, []);

  const addSubject = useCallback(
    async (draft: SubjectDraft) => {
      setError("");
      const payload = {
        ...draft,
        icon: initials(draft.name),
        color: colors[state.subjects.length % colors.length],
      };

      try {
        const { subject } = await api.workspace.createSubject(payload);
        updateState((current) => ({
          ...current,
          subjects: [...current.subjects, subject],
        }));
      } catch (createError) {
        setError(messageFor(createError, "No pudimos crear la materia."));
      }
    },
    [state.subjects.length, updateState],
  );

  const updateSubject = useCallback(
    async (id: string, draft: SubjectDraft) => {
      setError("");
      const currentSubject = state.subjects.find((subject) => subject.id === id);
      if (!currentSubject) return;

      const optimistic = {
        ...currentSubject,
        ...draft,
        icon: initials(draft.name),
      };

      updateState((current) => ({
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.id === id ? optimistic : subject,
        ),
      }));

      try {
        const { subject } = await api.workspace.updateSubject(id, {
          ...draft,
          icon: optimistic.icon,
          color: currentSubject.color,
        });
        updateState((current) => ({
          ...current,
          subjects: current.subjects.map((item) => (item.id === id ? subject : item)),
        }));
      } catch (updateError) {
        updateState((current) => ({
          ...current,
          subjects: current.subjects.map((subject) =>
            subject.id === id ? currentSubject : subject,
          ),
        }));
        setError(messageFor(updateError, "No pudimos actualizar la materia."));
      }
    },
    [state.subjects, updateState],
  );

  const deleteSubject = useCallback(
    async (id: string) => {
      setError("");
      const previous = state;

      updateState((current) => ({
        ...current,
        subjects: current.subjects.filter((subject) => subject.id !== id),
        tasks: current.tasks.filter((task) => task.subjectId !== id),
      }));

      try {
        await api.workspace.deleteSubject(id);
      } catch (deleteError) {
        updateState(() => previous);
        setError(messageFor(deleteError, "No pudimos eliminar la materia."));
      }
    },
    [state, updateState],
  );

  const addTask = useCallback(
    async (draft: TaskDraft) => {
      setError("");

      try {
        const { task } = await api.workspace.createTask(draft);
        updateState((current) => ({ ...current, tasks: [...current.tasks, task] }));
      } catch (createError) {
        setError(messageFor(createError, "No pudimos crear la tarea."));
      }
    },
    [updateState],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      setError("");
      const currentTask = state.tasks.find((task) => task.id === id);
      if (!currentTask) return;

      const optimistic = { ...currentTask, done: !currentTask.done };
      updateState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === id ? optimistic : task)),
      }));

      try {
        const { task } = await api.workspace.updateTask(id, { done: optimistic.done });
        updateState((current) => ({
          ...current,
          tasks: current.tasks.map((item) => (item.id === id ? task : item)),
        }));
      } catch (updateError) {
        updateState((current) => ({
          ...current,
          tasks: current.tasks.map((task) => (task.id === id ? currentTask : task)),
        }));
        setError(messageFor(updateError, "No pudimos actualizar la tarea."));
      }
    },
    [state.tasks, updateState],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setError("");
      const previous = state;

      updateState((current) => ({
        ...current,
        tasks: current.tasks.filter((task) => task.id !== id),
      }));

      try {
        await api.workspace.deleteTask(id);
      } catch (deleteError) {
        updateState(() => previous);
        setError(messageFor(deleteError, "No pudimos eliminar la tarea."));
      }
    },
    [state, updateState],
  );

  const value = useMemo(
    () => ({
      ...state,
      status,
      error,
      reload,
      addSubject,
      updateSubject,
      deleteSubject,
      addTask,
      toggleTask,
      deleteTask,
    }),
    [
      state,
      status,
      error,
      reload,
      addSubject,
      updateSubject,
      deleteSubject,
      addTask,
      toggleTask,
      deleteTask,
    ],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy debe usarse dentro de StudyProvider.");
  return context;
}
