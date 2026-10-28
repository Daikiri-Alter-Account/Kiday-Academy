import { useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, FileText, Sparkles, Wand2 } from "lucide-react";

const suggestions = [
  "Explícame la regla de la cadena con un ejemplo",
  "Hazme un quiz de biología celular",
  "Resume mis apuntes de historia universal",
];

const capabilities = [
  { icon: BookOpen, title: "Explicar temas", description: "Paso a paso, con ejemplos adaptados a tu nivel." },
  { icon: Wand2, title: "Generar quizzes", description: "Preguntas de práctica a partir de tus materias." },
  { icon: FileText, title: "Resumir apuntes", description: "Convierte tus notas en repasos cortos y claros." },
];

export function AssistantPage() {
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setNotice("Kiday IA aún no está conectada. Tu pregunta quedó lista para el próximo módulo.");
    setPrompt("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Asistente IA</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Tu compañero de estudio para entender, practicar y repasar.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="flex min-h-[440px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
              <Sparkles size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Kiday IA</p>
              <p className="text-[10px] text-[var(--muted)]">En preparación</p>
            </div>
            <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] text-amber-300">Próximamente</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-[var(--accent)]">
              <Sparkles size={26} />
            </span>
            <h3 className="mt-4 text-base font-semibold">¿Qué quieres aprender hoy?</h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">
              Estamos conectando el asistente a tus materias. Mientras tanto, puedes dejar lista tu primera pregunta.
            </p>

            <div className="mt-5 flex w-full max-w-md flex-col gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  className="group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2.5 text-left text-[11px] text-[var(--muted)] transition hover:border-violet-400/30 hover:text-[var(--foreground)]"
                >
                  <ArrowRight size={13} className="shrink-0 text-[var(--accent)] transition group-hover:translate-x-0.5" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[var(--border)] p-3 sm:p-4">
            {notice && <p className="mb-2 rounded-lg bg-violet-500/10 px-3 py-2 text-[10px] text-[var(--accent)]">{notice}</p>}
            <div className="flex items-end gap-2">
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Escribe tu pregunta..."
                aria-label="Pregunta para Kiday IA"
                className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/50"
              />
              <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition hover:brightness-110" aria-label="Enviar pregunta">
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <h3 className="text-sm font-semibold">Qué podrás hacer</h3>
            <ul className="mt-3 space-y-3">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-[var(--accent)]">
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-medium">{title}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-[var(--muted)]">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4">
            <p className="text-xs font-medium text-emerald-200">Consejo</p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
              Mientras llega la IA, usa el promediador para saber cuánto necesitas en tu próximo examen.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
