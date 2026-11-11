import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PlanGate } from "@/components/plan-gate";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { hasCapability } from "@/lib/plans";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Explícame la regla de la cadena con un ejemplo",
  "Hazme un quiz de biología celular",
  "Resume mis apuntes de historia universal",
  "¿Qué plan de Kiday me conviene?",
];

const capabilities = [
  { icon: BookOpen, title: "Explicar temas", description: "Paso a paso, con ejemplos adaptados a tu nivel." },
  { icon: Wand2, title: "Generar quizzes", description: "Preguntas de práctica a partir de tus materias." },
  { icon: FileText, title: "Resumir apuntes", description: "Convierte tus notas en repasos cortos y claros." },
];

export function AssistantPage() {
  const { user } = useAuth();
  const canUse = hasCapability(user, "assistant");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!canUse) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Asistente IA</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Tu compañero de estudio para entender, practicar y repasar.</p>
        </div>
        <PlanGate
          requiredPlan="kiday-pro"
          title="Kiday IA está disponible en Kiday Pro"
          description="Sube de plan para conversar con el asistente académico, pedir explicaciones paso a paso, generar quizzes y resumir tus apuntes."
          benefits={[
            "Explicaciones paso a paso",
            "Quizzes de práctica",
            "Resúmenes de apuntes",
            "Recomendaciones según tu plan",
          ]}
        />
      </div>
    );
  }

  async function requestReply(history: ChatMessage[]) {
    setSending(true);
    setError("");
    try {
      const result = await api.chat(history);
      setMessages([...history, { role: "assistant", content: result.reply }]);
    } catch (chatError) {
      setError(
        chatError instanceof Error
          ? chatError.message
          : "No pudimos obtener respuesta de Kiday IA. Intenta de nuevo.",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setPrompt("");
    await requestReply(history);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(prompt);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(prompt);
    }
  }

  function retry() {
    if (sending || messages.length === 0) return;
    void requestReply(messages);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Asistente IA</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Tu compañero de estudio para entender, practicar y repasar.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="flex min-h-[560px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
              <Sparkles size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Kiday IA</p>
              <p className="text-[10px] text-[var(--muted)]">Asistente académico de Kiday Academy</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Beta
            </span>
          </div>

          <div
            ref={scrollRef}
            aria-live="polite"
            className="flex max-h-[430px] flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5"
          >
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <span className="grid size-14 place-items-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-[var(--accent)]">
                  <Sparkles size={26} />
                </span>
                <h3 className="mt-4 text-base font-semibold">¿Qué quieres aprender hoy?</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">
                  Pregúntame por un tema, pídeme un quiz o un resumen. Conozco los planes de Kiday Academy y puedo ayudarte a elegir el mejor para ti.
                </p>

                <div className="mt-5 flex w-full max-w-md flex-col gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      className="group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2.5 text-left text-[11px] text-[var(--muted)] transition hover:border-violet-400/30 hover:text-[var(--foreground)]"
                    >
                      <ArrowRight size={13} className="shrink-0 text-[var(--accent)] transition group-hover:translate-x-0.5" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isUser = message.role === "user";
                return (
                  <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-[9px] font-semibold ${
                        isUser
                          ? "bg-white/10 text-[var(--foreground)]"
                          : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                      }`}
                    >
                      {isUser ? "Tú" : <Sparkles size={14} />}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${
                        isUser
                          ? "bg-violet-500/15 text-[var(--foreground)]"
                          : "border border-[var(--border)] bg-black/10"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                  <Sparkles size={14} />
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-black/10 px-3.5 py-3 text-[10px] text-[var(--muted)]">
                  <Loader2 size={13} className="animate-spin" /> Kiday IA está pensando...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-[11px] text-rose-300 sm:mx-5">
              <span>{error}</span>
              {messages.length > 0 && (
                <button type="button" onClick={retry} className="inline-flex items-center gap-1 font-medium hover:underline">
                  <RefreshCw size={12} /> Reintentar
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-[var(--border)] p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={2000}
                rows={1}
                placeholder="Escribe tu pregunta... (Enter para enviar)"
                aria-label="Pregunta para Kiday IA"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-xs leading-5 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-violet-400/50"
              />
              <button
                type="submit"
                disabled={sending || !prompt.trim()}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Enviar pregunta"
              >
                {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">
              Kiday IA puede cometer errores. Verifica la información importante.
            </p>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <h3 className="text-sm font-semibold">Qué puedes hacer</h3>
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

          <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.1] to-indigo-500/[0.04] p-4">
            <p className="text-xs font-medium text-[var(--accent)]">Consejo</p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
              Sé específico: incluye tu nivel, la materia y qué necesitas. Así obtendrás mejores respuestas.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4">
            <p className="text-xs font-medium text-emerald-200">Conoce el catálogo</p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
              Pregunta por Kiday Free, Pro o Academy y te ayudo a elegir según tus necesidades.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
