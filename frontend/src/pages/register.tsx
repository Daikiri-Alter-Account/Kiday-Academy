import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";

export function RegisterPage() {
  const { status, user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--background)] text-[var(--muted)]">
        <Loader2 size={22} className="animate-spin" aria-label="Cargando sesión" />
      </div>
    );
  }

  if (status === "authenticated" && user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate("/app", { replace: true });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "No pudimos crear tu cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--background)] px-5 py-10 text-[var(--foreground)]">
      <div className="pointer-events-none absolute left-1/2 top-[-260px] -z-10 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-200px] left-[-120px] -z-10 size-[420px] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1.5 text-[11px] font-medium text-[var(--accent)]">
            <Sparkles size={13} /> Empieza gratis
          </span>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Crea tu cuenta</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Un solo lugar para tus materias, tareas, notas y estudio con IA.
          </p>

          <div aria-live="polite">
            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Nombre completo</span>
              <span className="relative flex items-center">
                <UserRound size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
                />
              </span>
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Correo electrónico</span>
              <span className="relative flex items-center">
                <Mail size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
                />
              </span>
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Contraseña</span>
              <span className="relative flex items-center">
                <LockKeyhole size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-11 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Confirmar contraseña</span>
              <span className="relative flex items-center">
                <LockKeyhole size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creando cuenta...
                </>
              ) : (
                "Crear cuenta gratis"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[var(--muted)]">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-[var(--accent)] hover:underline">
              Inicia sesión
            </Link>
          </p>

          <div className="mt-5 flex items-center justify-center gap-4 border-t border-[var(--border)] pt-4 text-[10px] text-[var(--muted)]">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-[var(--foreground)]">
              <ArrowLeft size={12} /> Inicio
            </Link>
            <Link to="/admin/login" className="inline-flex items-center gap-1 hover:text-[var(--foreground)]">
              <ShieldCheck size={12} /> Acceso admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
