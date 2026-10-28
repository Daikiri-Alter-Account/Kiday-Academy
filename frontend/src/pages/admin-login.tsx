import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";

const highlights = [
  { icon: ShieldCheck, text: "Acceso privado solo para administradores" },
  { icon: Sparkles, text: "Gestiona los planes y el catálogo de Kiday" },
  { icon: UsersRound, text: "Responde los mensajes del formulario de contacto" },
];

export function AdminLoginPage() {
  const { status, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  if (status === "authenticated") return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role !== "admin") {
        await logout();
        setError("Esta cuenta no tiene permisos de administrador.");
        return;
      }
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No pudimos iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--background)] text-[var(--muted)]">
        <Loader2 size={22} className="animate-spin" aria-label="Cargando sesión" />
      </div>
    );
  }

  return (
    <div className="relative grid min-h-screen bg-[var(--background)] text-[var(--foreground)] lg:grid-cols-2">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[800px] -translate-x-1/2 rounded-full bg-violet-700/15 blur-[140px]" />

      <aside className="relative hidden flex-col justify-between border-r border-[var(--border)] bg-[var(--surface-sidebar)]/60 p-10 lg:flex">
        <Brand />
        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1.5 text-[11px] font-medium text-[var(--accent)]">
            <ShieldCheck size={13} /> Panel de administración
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            Gestiona Kiday Academy desde un solo lugar.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Administra el catálogo de planes, revisa los mensajes de contacto y mantén la información del negocio al día.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-xs text-[var(--muted)]">
                <span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-[var(--accent)]">
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          © {new Date().getFullYear()} Kiday Studio. Acceso restringido.
        </p>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5 sm:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:bg-white/5"
            >
              <ArrowLeft size={14} /> Volver
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <form onSubmit={handleSubmit} className="w-full max-w-sm" noValidate>
            <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Accede con tu cuenta de administrador.</p>

            <div aria-live="polite">
              {error && (
                <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
                  {error}
                </p>
              )}
            </div>

            <label className="mt-6 block">
              <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Correo electrónico</span>
              <span className="relative flex items-center">
                <Mail size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="admin@kiday.studio"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
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
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-11 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
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

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Entrando...
                </>
              ) : (
                "Entrar al panel"
              )}
            </button>

            <p className="mt-4 text-center text-[10px] leading-4 text-[var(--muted)]">
              El acceso está limitado a cuentas con rol de administrador.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
