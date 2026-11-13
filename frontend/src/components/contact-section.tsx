import { useState, type FormEvent } from "react";
import { Check, Clock3, Loader2, Mail, Send, ShieldCheck } from "lucide-react";
import { api, type Service } from "@/lib/api";

type ContactSectionProps = {
  services: Service[];
  subject: string;
  onSubjectChange: (subject: string) => void;
};

type FormState = "idle" | "sending" | "sent" | "error";

export function ContactSection({ services, subject, onSubjectChange }: ContactSectionProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState<FormState>("idle");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 10) {
      setState("error");
      setError("Completa tu nombre, correo y un mensaje de al menos 10 caracteres.");
      return;
    }

    setState("sending");
    try {
      const result = await api.contact({ ...form, subject });
      setFeedback(result.message);
      setState("sent");
      setForm({ name: "", email: "", message: "" });
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : "No pudimos enviar tu mensaje.");
    }
  }

  function resetForm() {
    setState("idle");
    setError("");
    setFeedback("");
  }

  return (
    <section id="contacto" className="px-5 pb-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Contacto</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Hablemos de tu semestre</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            Cuéntanos qué necesitas y te ayudamos a elegir el plan o el acompañamiento ideal para tus metas académicas.
          </p>

          <ul className="mt-6 space-y-3 text-xs text-[var(--muted)]">
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="text-[var(--accent)]" />
              <a href="mailto:hola@kiday.studio" className="transition hover:text-[var(--foreground)]">
                hola@kiday.studio
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock3 size={15} className="text-[var(--accent)]" /> Revisamos los mensajes desde el panel de administración
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck size={15} className="text-[var(--accent)]" /> No incluyas contraseñas ni datos sensibles
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 sm:p-6">
          {state === "sent" ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center" aria-live="polite">
              <span className="grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <Check size={24} />
              </span>
              <h3 className="mt-4 text-base font-semibold">¡Mensaje recibido!</h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--muted)]">{feedback}</p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium transition hover:bg-white/5"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Nombre</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    maxLength={120}
                    autoComplete="name"
                    placeholder="Tu nombre"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Correo</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    maxLength={254}
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">¿Sobre qué quieres hablar?</span>
                <select
                  value={subject}
                  onChange={(event) => onSubjectChange(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--foreground)] outline-none transition focus:border-violet-400/60"
                >
                  <option value="Consulta general">Consulta general</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
                  Mensaje <span className="font-normal">{form.message.length}/2000</span>
                </span>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  maxLength={2000}
                  rows={5}
                  placeholder="Cuéntanos qué materia o meta quieres trabajar..."
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs leading-5 outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/60"
                />
              </label>

              <div aria-live="polite">
                {state === "error" && error && (
                  <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={state === "sending"}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === "sending" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Enviar mensaje
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
