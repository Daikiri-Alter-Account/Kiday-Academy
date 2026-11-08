import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { calculateAge, todayInputValue } from "@/lib/profile";

const inputClass =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60";

export function RegisterPage() {
  const { status, user, register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [institution, setInstitution] = useState("");
  const [grade, setGrade] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = todayInputValue();
  const age = calculateAge(birthDate);

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

  function validateAccount() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return false;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return false;
    }
    return true;
  }

  function validateProfile() {
    if (firstName.trim().length < 2) {
      setError("Escribe tu nombre.");
      return false;
    }
    if (lastName.trim().length < 2) {
      setError("Escribe tu apellido.");
      return false;
    }
    if (!birthDate) {
      setError("Selecciona tu fecha de nacimiento.");
      return false;
    }
    if (age === null || age < 5 || age > 120) {
      setError("La fecha de nacimiento no es válida. Debes tener entre 5 y 120 años.");
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (step === 1) {
      if (validateAccount()) setStep(2);
      return;
    }

    if (!validateProfile()) return;

    setSubmitting(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        institution: institution.trim() || undefined,
        grade: grade.trim() || undefined,
        email: email.trim(),
        password,
      });
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
            {step === 1 ? <Sparkles size={13} /> : <UserRound size={13} />}
            {step === 1 ? "Empieza gratis" : "Paso 2 de 2"}
          </span>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
            {step === 1 ? "Crea tu cuenta" : "Cuéntanos de ti"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {step === 1
              ? "Primero crea tus credenciales para entrar a Kiday Studio."
              : "Completa tus datos personales para personalizar tu experiencia."}
          </p>

          <div className="mt-5 flex items-center gap-2" aria-hidden="true">
            <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-[var(--track)]"}`} />
            <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-[var(--track)]"}`} />
          </div>
          <p className="mt-2 text-[10px] text-[var(--muted)]">
            Paso {step} de 2 · {step === 1 ? "Credenciales" : "Datos personales"}
          </p>

          <div aria-live="polite">
            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            {step === 1 ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Correo electrónico</span>
                  <span className="relative flex items-center">
                    <Mail size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      className={inputClass}
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
                      className={`${inputClass} pr-11`}
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
                      className={inputClass}
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Nombre</span>
                    <span className="relative flex items-center">
                      <UserRound size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        autoComplete="given-name"
                        placeholder="Tu nombre"
                        maxLength={60}
                        className={inputClass}
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Apellido</span>
                    <span className="relative flex items-center">
                      <UserRound size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        autoComplete="family-name"
                        placeholder="Tu apellido"
                        maxLength={60}
                        className={inputClass}
                      />
                    </span>
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-medium text-[var(--muted)]">
                    <span>Fecha de nacimiento</span>
                    {age !== null && age >= 0 && age <= 120 && (
                      <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                        {age} años
                      </span>
                    )}
                  </span>
                  <span className="relative flex items-center">
                    <CalendarDays size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(event) => setBirthDate(event.target.value)}
                      autoComplete="bday"
                      min="1900-01-01"
                      max={today}
                      className={inputClass}
                    />
                  </span>
                </label>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">
                      Institución <span className="font-normal text-[var(--muted)]">(opcional)</span>
                    </span>
                    <span className="relative flex items-center">
                      <School size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                      <input
                        type="text"
                        value={institution}
                        onChange={(event) => setInstitution(event.target.value)}
                        autoComplete="organization"
                        placeholder="Colegio o universidad"
                        maxLength={120}
                        className={inputClass}
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">
                      Grado o semestre <span className="font-normal text-[var(--muted)]">(opcional)</span>
                    </span>
                    <span className="relative flex items-center">
                      <GraduationCap size={15} className="pointer-events-none absolute left-3 text-[var(--muted)]" />
                      <input
                        type="text"
                        value={grade}
                        onChange={(event) => setGrade(event.target.value)}
                        placeholder="Ej. 11.º o 5.º semestre"
                        maxLength={60}
                        className={inputClass}
                      />
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                    disabled={submitting}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-4 text-xs font-medium text-[var(--foreground)] transition hover:bg-white/5 disabled:opacity-60"
                  >
                    <ArrowLeft size={14} /> Volver
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Creando cuenta...
                      </>
                    ) : (
                      "Crear mi cuenta"
                    )}
                  </button>
                </div>
              </>
            )}
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
