import type { Subject, SubjectStatus } from "@/data/mock";

const configuredUrl = import.meta.env.VITE_API_URL?.trim();
const fallbackUrl = import.meta.env.PROD
  ? "https://kiday-academy-api.onrender.com"
  : "http://localhost:4000";

export const API_URL = (configuredUrl || fallbackUrl).replace(/\/+$/, "");

const TOKEN_KEY = "kiday-token";

export type Service = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  currency: string;
  period: string | null;
  features: string[];
  highlighted: boolean;
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ServicePayload = {
  name: string;
  slug?: string;
  tagline: string;
  description: string;
  price: number;
  currency?: string;
  period?: string | null;
  features: string[];
  highlighted?: boolean;
  active?: boolean;
  order?: number;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "nuevo" | "leido" | "respondido";
  createdAt: string;
  updatedAt: string;
};

export type AdminStats = {
  messages: number;
  newMessages: number;
  services: number;
  users: number;
  students: number;
};

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type PlanSlug = "kiday-free" | "kiday-pro" | "kiday-academy";

export type AuthUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  age: number | null;
  institution: string | null;
  grade: string | null;
  email: string;
  role: "admin" | "student";
  plan: PlanSlug | null;
  capabilities: string[];
};

export type LoginResponse = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  birthDate: string;
  institution?: string;
  grade?: string;
  email: string;
  password: string;
};

export type TaskPriority = "alta" | "media" | "baja";

export type WorkspaceTask = {
  id: string;
  title: string;
  subjectId: string | null;
  dueDate: string;
  priority: TaskPriority;
  done: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Workspace = {
  subjects: Subject[];
  tasks: WorkspaceTask[];
};

export type GroupRole = "owner" | "member";

export type StudyGroupMember = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  role: GroupRole;
  joinedAt: string;
};

export type GroupSession = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  createdBy: string | null;
  createdAt?: string;
};

export type StudyGroup = {
  id: string;
  name: string;
  subject: string;
  description: string;
  inviteCode: string;
  accent: string;
  ownerId: string;
  role: GroupRole;
  memberCount: number;
  members: StudyGroupMember[];
  sessions: GroupSession[];
  nextSession: GroupSession | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GradeItem = {
  id: string;
  subjectId: string | null;
  name: string;
  grade: number;
  weight: number;
  createdAt?: string;
  updatedAt?: string;
};

export type GradeInput = {
  name: string;
  grade: number;
  weight: number;
  subjectId?: string | null;
};

export type MaterialType = "apunte" | "pdf" | "video" | "enlace" | "ejercicio" | "libro";

export type MaterialItem = {
  id: string;
  subjectId: string | null;
  title: string;
  url: string;
  type: MaterialType;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MaterialInput = {
  title: string;
  url: string;
  type: MaterialType;
  description?: string;
  subjectId?: string | null;
};

export type GroupInput = {
  name: string;
  subject: string;
  description?: string;
};

export type GroupSessionInput = {
  title: string;
  startsAt: string;
  durationMinutes: number;
  location?: string;
};

export type GroupMessage = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    firstName: string;
    initials: string;
  };
};

export type SubjectInput = {
  name: string;
  detail: string;
  icon?: string;
  color?: string;
  average: number;
  completed: number;
  total: number;
  status: SubjectStatus;
};

export type TaskInput = {
  title: string;
  subjectId: string | null;
  dueDate: string;
  priority: TaskPriority;
  done?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  const token = options.token ?? getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError("No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.", 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.error ?? "Ocurrió un error inesperado. Intenta de nuevo.", response.status);
  }

  return payload as T;
}

export const api = {
  services: () => apiRequest<{ services: Service[] }>("/api/services"),
  contact: (payload: ContactPayload) =>
    apiRequest<{ id: string; message: string }>("/api/contact", {
      method: "POST",
      body: payload,
    }),
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  register: (payload: RegisterPayload) =>
    apiRequest<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
    }),
  me: () => apiRequest<{ user: AuthUser }>("/api/auth/me"),
  logout: () => apiRequest<void>("/api/auth/logout", { method: "POST" }),
  chat: (messages: { role: "user" | "assistant"; content: string }[]) =>
    apiRequest<{ reply: string }>("/api/ai/chat", {
      method: "POST",
      body: { messages },
    }),
  grades: {
    list: () => apiRequest<{ grades: GradeItem[] }>("/api/grades"),
    create: (payload: GradeInput) =>
      apiRequest<{ grade: GradeItem }>("/api/grades", {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<GradeInput>) =>
      apiRequest<{ grade: GradeItem }>(`/api/grades/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    deleteGrade: (id: string) =>
      apiRequest<void>(`/api/grades/${id}`, { method: "DELETE" }),
  },
  materials: {
    list: () => apiRequest<{ materials: MaterialItem[] }>("/api/materials"),
    create: (payload: MaterialInput) =>
      apiRequest<{ material: MaterialItem }>("/api/materials", {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<MaterialInput>) =>
      apiRequest<{ material: MaterialItem }>(`/api/materials/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    deleteMaterial: (id: string) =>
      apiRequest<void>(`/api/materials/${id}`, { method: "DELETE" }),
  },
  groups: {
    list: () => apiRequest<{ groups: StudyGroup[] }>("/api/groups"),
    get: (id: string) => apiRequest<{ group: StudyGroup }>(`/api/groups/${id}`),
    create: (payload: GroupInput) =>
      apiRequest<{ group: StudyGroup }>("/api/groups", {
        method: "POST",
        body: payload,
      }),
    join: (code: string) =>
      apiRequest<{ group: StudyGroup }>("/api/groups/join", {
        method: "POST",
        body: { code },
      }),
    leave: (id: string) =>
      apiRequest<void>(`/api/groups/${id}/leave`, { method: "POST" }),
    deleteGroup: (id: string) =>
      apiRequest<void>(`/api/groups/${id}`, { method: "DELETE" }),
    createSession: (id: string, payload: GroupSessionInput) =>
      apiRequest<{ session: GroupSession }>(`/api/groups/${id}/sessions`, {
        method: "POST",
        body: payload,
      }),
    deleteSession: (id: string, sessionId: string) =>
      apiRequest<void>(`/api/groups/${id}/sessions/${sessionId}`, { method: "DELETE" }),
    messages: (id: string) =>
      apiRequest<{ messages: GroupMessage[]; hasMore: boolean; nextBefore: string | null }>(
        `/api/groups/${id}/messages`,
      ),
    sendMessage: (id: string, content: string) =>
      apiRequest<{ message: GroupMessage }>(`/api/groups/${id}/messages`, {
        method: "POST",
        body: { content },
      }),
    deleteMessage: (id: string, messageId: string) =>
      apiRequest<void>(`/api/groups/${id}/messages/${messageId}`, { method: "DELETE" }),
  },
  workspace: {
    get: () => apiRequest<Workspace>("/api/workspace"),
    importWorkspace: (payload: { subjects: Subject[]; tasks: WorkspaceTask[] }) =>
      apiRequest<Workspace>("/api/workspace/import", {
        method: "POST",
        body: payload,
      }),
    createSubject: (payload: SubjectInput) =>
      apiRequest<{ subject: Subject }>("/api/workspace/subjects", {
        method: "POST",
        body: payload,
      }),
    updateSubject: (id: string, payload: Partial<SubjectInput>) =>
      apiRequest<{ subject: Subject }>(`/api/workspace/subjects/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    deleteSubject: (id: string) =>
      apiRequest<void>(`/api/workspace/subjects/${id}`, { method: "DELETE" }),
    createTask: (payload: TaskInput) =>
      apiRequest<{ task: WorkspaceTask }>("/api/workspace/tasks", {
        method: "POST",
        body: payload,
      }),
    updateTask: (id: string, payload: Partial<TaskInput>) =>
      apiRequest<{ task: WorkspaceTask }>(`/api/workspace/tasks/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    deleteTask: (id: string) =>
      apiRequest<void>(`/api/workspace/tasks/${id}`, { method: "DELETE" }),
  },
  admin: {
    stats: () => apiRequest<AdminStats>("/api/admin/stats"),
    messages: (status?: ContactMessage["status"]) =>
      apiRequest<{ messages: ContactMessage[] }>(
        `/api/admin/messages${status ? `?status=${status}` : ""}`,
      ),
    updateMessage: (id: string, status: ContactMessage["status"]) =>
      apiRequest<{ message: ContactMessage }>(`/api/admin/messages/${id}`, {
        method: "PATCH",
        body: { status },
      }),
    deleteMessage: (id: string) =>
      apiRequest<void>(`/api/admin/messages/${id}`, { method: "DELETE" }),
    services: () => apiRequest<{ services: Service[] }>("/api/admin/services"),
    createService: (payload: ServicePayload) =>
      apiRequest<{ service: Service }>("/api/admin/services", {
        method: "POST",
        body: payload,
      }),
    updateService: (id: string, payload: Partial<ServicePayload>) =>
      apiRequest<{ service: Service }>(`/api/admin/services/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    deleteService: (id: string) =>
      apiRequest<void>(`/api/admin/services/${id}`, { method: "DELETE" }),
  },
};

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}
