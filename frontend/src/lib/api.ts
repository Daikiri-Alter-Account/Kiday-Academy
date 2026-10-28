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
  me: () => apiRequest<{ user: AuthUser }>("/api/auth/me"),
  logout: () => apiRequest<void>("/api/auth/logout", { method: "POST" }),
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
