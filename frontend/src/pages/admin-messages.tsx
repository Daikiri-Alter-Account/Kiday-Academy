import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { MessageStatusBadge, messageStatusMeta } from "@/components/message-status";
import { api, type ContactMessage } from "@/lib/api";

const filters: { value: "todos" | ContactMessage["status"]; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "nuevo", label: "Nuevos" },
  { value: "leido", label: "Leídos" },
  { value: "respondido", label: "Respondidos" },
];

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<"todos" | ContactMessage["status"]>("todos");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await api.admin.messages();
      setMessages(result.messages);
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar los mensajes.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleMessages = useMemo(
    () => (filter === "todos" ? messages : messages.filter((message) => message.status === filter)),
    [filter, messages],
  );

  const counts = useMemo(
    () => ({
      todos: messages.length,
      nuevo: messages.filter((message) => message.status === "nuevo").length,
      leido: messages.filter((message) => message.status === "leido").length,
      respondido: messages.filter((message) => message.status === "respondido").length,
    }),
    [messages],
  );

  async function changeStatus(message: ContactMessage, nextStatus: ContactMessage["status"]) {
    setBusyId(message.id);
    setError("");
    try {
      const result = await api.admin.updateMessage(message.id, nextStatus);
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? result.message : item)),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No pudimos actualizar el mensaje.");
    } finally {
      setBusyId("");
    }
  }

  async function removeMessage(message: ContactMessage) {
    if (!window.confirm(`¿Eliminar el mensaje de ${message.name}?`)) return;

    setBusyId(message.id);
    setError("");
    try {
      await api.admin.deleteMessage(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No pudimos eliminar el mensaje.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Mensajes</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Consultas recibidas desde el formulario de contacto.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:bg-white/5"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === item.value
                ? "bg-violet-500/15 text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {item.label} <span className="ml-1 text-[10px] opacity-70">{counts[item.value]}</span>
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">{error}</p>}
      </div>

      {status === "loading" && (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-6 text-center">
          <p className="text-sm font-medium">No pudimos cargar los mensajes.</p>
          <button type="button" onClick={load} className="mt-4 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium">
            Reintentar
          </button>
        </div>
      )}

      {status === "ready" && visibleMessages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
          <Inbox size={24} className="mx-auto text-[var(--muted)]" />
          <p className="mt-3 text-sm font-medium">No hay mensajes en esta categoría.</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Cuando alguien use el formulario, aparecerá aquí.</p>
        </div>
      )}

      {status === "ready" && visibleMessages.length > 0 && (
        <div className="space-y-3">
          {visibleMessages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{message.subject}</h3>
                    <MessageStatusBadge status={message.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {message.name} · <a href={`mailto:${message.email}`} className="hover:text-[var(--foreground)]">{message.email}</a>
                  </p>
                </div>
                <span className="text-[10px] text-[var(--muted)]">{dateFormatter.format(new Date(message.createdAt))}</span>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-black/10 p-3 text-xs leading-5 text-[var(--muted)]">
                {message.message}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {(Object.keys(messageStatusMeta) as ContactMessage["status"][]).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      type="button"
                      disabled={message.status === nextStatus || busyId === message.id}
                      onClick={() => changeStatus(message, nextStatus)}
                      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition disabled:opacity-40 ${
                        message.status === nextStatus
                          ? messageStatusMeta[nextStatus].className
                          : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {messageStatusMeta[nextStatus].label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => removeMessage(message)}
                  disabled={busyId === message.id}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                >
                  {busyId === message.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
