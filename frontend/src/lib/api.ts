const configuredUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredUrl || "http://localhost:4000").replace(/\/+$/, "");

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

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
};

export type LoginResponse = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
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
