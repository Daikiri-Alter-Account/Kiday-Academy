import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  LogOut,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { PlanGate } from "@/components/plan-gate";
import {
  api,
  type GroupInput,
  type GroupMessage,
  type GroupSessionInput,
  type StudyGroup,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { hasCapability } from "@/lib/plans";

type Editor = "create" | "join" | null;
type LoadStatus = "loading" | "ready" | "error";

const sessionFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const messageFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatSession(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha por confirmar" : sessionFormatter.format(date);
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function localInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSessionStart() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return localInputValue(date);
}

function CreateGroupForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: GroupInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();

    if (!trimmedName) {
      setError("Escribe el nombre del grupo.");
      return;
    }
    if (!trimmedSubject) {
      setError("Escribe la materia o tema del grupo.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        subject: trimmedSubject,
        description: description.trim(),
      });
    } catch (submitError) {
      setError(messageFor(submitError, "No pudimos crear el grupo."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="group-name" className="mb-1.5 block text-xs font-medium">
          Nombre del grupo
        </label>
        <input
          id="group-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder="Ej. Cálculo sin miedo"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      <div>
        <label htmlFor="group-subject" className="mb-1.5 block text-xs font-medium">
          Materia o tema
        </label>
        <input
          id="group-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={60}
          placeholder="Ej. Cálculo diferencial"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      <div>
        <label htmlFor="group-description" className="mb-1.5 block text-xs font-medium">
          Descripción <span className="font-normal text-[var(--muted)]">(opcional)</span>
        </label>
        <textarea
          id="group-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={280}
          rows={3}
          placeholder="¿Qué van a estudiar y cómo se van a organizar?"
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-[var(--border)] px-4 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creando..." : "Crear grupo"}
        </button>
      </div>
    </form>
  );
}

function JoinGroupForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();

    if (trimmed.length < 6) {
      setError("Escribe el código de invitación completo.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } catch (submitError) {
      setError(messageFor(submitError, "No pudimos unirte al grupo."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="group-code" className="mb-1.5 block text-xs font-medium">
          Código de invitación
        </label>
        <input
          id="group-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="Ej. K7M2P9QX"
          className="h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-center font-mono text-base tracking-[0.3em] outline-none transition focus:border-violet-400/50"
        />
        <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
          Pídele el código a quien creó el grupo. También aparece dentro del grupo.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-[var(--border)] px-4 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Uniéndome..." : "Unirme al grupo"}
        </button>
      </div>
    </form>
  );
}

function SessionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: GroupSessionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(defaultSessionStart);
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const date = new Date(startsAt);

    if (!trimmedTitle) {
      setError("Escribe el tema de la sesión.");
      return;
    }
    if (!startsAt || Number.isNaN(date.getTime())) {
      setError("Selecciona una fecha y hora válidas.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        startsAt: date.toISOString(),
        durationMinutes: Number(duration),
        location: location.trim(),
      });
    } catch (submitError) {
      setError(messageFor(submitError, "No pudimos programar la sesión."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
      <div>
        <label htmlFor="session-title" className="mb-1.5 block text-xs font-medium">
          Tema de la sesión
        </label>
        <input
          id="session-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          placeholder="Ej. Repaso de derivadas"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="session-date" className="mb-1.5 block text-xs font-medium">
            Fecha y hora
          </label>
          <input
            id="session-date"
            type="datetime-local"
            value={startsAt}
            min={localInputValue(new Date())}
            onChange={(event) => setStartsAt(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          />
        </div>
        <div>
          <label htmlFor="session-duration" className="mb-1.5 block text-xs font-medium">
            Duración
          </label>
          <select
            id="session-duration"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1 h 30 min</option>
            <option value="120">2 horas</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="session-location" className="mb-1.5 block text-xs font-medium">
          Lugar o enlace <span className="font-normal text-[var(--muted)]">(opcional)</span>
        </label>
        <input
          id="session-location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          maxLength={160}
          placeholder="Ej. Biblioteca o enlace de videollamada"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-9 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Programando..." : "Programar sesión"}
        </button>
      </div>
    </form>
  );
}

function GroupChat({ groupId, isOwner }: { groupId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!silent) setStatus("loading");
      try {
        const result = await api.groups.messages(groupId);
        setMessages(result.messages);
        setStatus("ready");
        setError("");
      } catch (loadError) {
        if (!silent) {
          setError(messageFor(loadError, "No pudimos cargar el chat."));
          setStatus("error");
        }
      }
    },
    [groupId],
  );

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadMessages(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setError("");
    setSending(true);
    try {
      await api.groups.sendMessage(groupId, trimmed);
      setContent("");
      await loadMessages(true);
    } catch (sendError) {
      setError(messageFor(sendError, "No pudimos enviar el mensaje."));
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(message: GroupMessage) {
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    setError("");
    setDeletingId(message.id);
    try {
      await api.groups.deleteMessage(groupId, message.id);
      await loadMessages(true);
    } catch (deleteError) {
      setError(messageFor(deleteError, "No pudimos eliminar el mensaje."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold">Chat del grupo</h3>
        <span className="text-[10px] text-[var(--muted)]">Se actualiza cada 5 segundos</span>
      </div>

      <div
        ref={listRef}
        className="mt-2 max-h-64 min-h-28 space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
      >
        {status === "loading" && (
          <div className="space-y-2">
            <div className="h-10 w-3/4 animate-pulse rounded-lg bg-white/5" />
            <div className="ml-auto h-10 w-2/3 animate-pulse rounded-lg bg-white/5" />
          </div>
        )}

        {status === "error" && (
          <div className="py-4 text-center">
            <p className="text-[11px] text-rose-300">{error}</p>
            <button
              type="button"
              onClick={() => void loadMessages()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-2.5 py-1.5 text-[10px] font-medium text-rose-300 transition hover:bg-rose-500/10"
            >
              <RefreshCw size={12} /> Reintentar
            </button>
          </div>
        )}

        {status === "ready" && messages.length === 0 && (
          <p className="py-6 text-center text-[11px] leading-5 text-[var(--muted)]">
            Todavía no hay mensajes. Escribe el primero para empezar a coordinar.
          </p>
        )}

        {status === "ready" &&
          messages.map((message) => {
            const own = message.author.id === user?.id;
            const canDelete = own || isOwner;
            return (
              <div key={message.id} className={`flex items-start gap-2 ${own ? "flex-row-reverse" : ""}`}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-[9px] font-semibold text-white">
                  {message.author.initials}
                </span>
                <div className={`min-w-0 max-w-[80%] ${own ? "text-right" : ""}`}>
                  <div className={`flex items-baseline gap-2 ${own ? "justify-end" : ""}`}>
                    <span className="truncate text-[10px] font-medium">
                      {own ? "Tú" : message.author.firstName}
                    </span>
                    <span className="shrink-0 text-[9px] text-[var(--muted)]">
                      {messageFormatter.format(new Date(message.createdAt))}
                    </span>
                  </div>
                  <p
                    className={`mt-1 whitespace-pre-wrap break-words rounded-xl border px-3 py-2 text-left text-xs leading-5 ${
                      own
                        ? "border-violet-400/20 bg-violet-500/15"
                        : "border-[var(--border)] bg-white/5"
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => void deleteMessage(message)}
                    disabled={deletingId === message.id}
                    aria-label={`Eliminar mensaje de ${message.author.name}`}
                    className="mt-5 grid size-7 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {error && status !== "error" && (
        <p role="alert" className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          {error}
        </p>
      )}

      <form onSubmit={sendMessage} className="mt-2 flex items-center gap-2">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={1000}
          placeholder="Escribe un mensaje..."
          aria-label="Mensaje para el grupo"
          className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          aria-label="Enviar mensaje"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </section>
  );
}

function GroupDetail({
  group,
  onClose,
  onChanged,
  onRemoved,
}: {
  group: StudyGroup;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onRemoved: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isOwner = group.role === "owner";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("No pudimos copiar el código. Selecciónalo y cópialo manualmente.");
    }
  }

  async function addSession(payload: GroupSessionInput) {
    setError("");
    await api.groups.createSession(group.id, payload);
    setSessionOpen(false);
    await onChanged();
  }

  async function removeSession(sessionId: string) {
    if (!window.confirm("¿Eliminar esta sesión del grupo?")) return;
    setError("");
    setBusy(true);
    try {
      await api.groups.deleteSession(group.id, sessionId);
      await onChanged();
    } catch (removeError) {
      setError(messageFor(removeError, "No pudimos eliminar la sesión."));
    } finally {
      setBusy(false);
    }
  }

  async function leaveGroup() {
    if (!window.confirm("¿Salir de este grupo? Podrás volver a unirte con el código.")) return;
    setError("");
    setBusy(true);
    try {
      await api.groups.leave(group.id);
      await onRemoved();
    } catch (leaveError) {
      setError(messageFor(leaveError, "No pudimos sacarte del grupo."));
      setBusy(false);
    }
  }

  async function deleteGroup() {
    if (!window.confirm(`¿Eliminar "${group.name}"? Se borrarán sus sesiones y miembros.`)) return;
    setError("");
    setBusy(true);
    try {
      await api.groups.deleteGroup(group.id);
      await onRemoved();
    } catch (deleteError) {
      setError(messageFor(deleteError, "No pudimos eliminar el grupo."));
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium text-violet-200">
          <UsersRound size={12} /> {isOwner ? "Creador" : "Miembro"}
        </span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-[var(--muted)]">
          {group.memberCount} {group.memberCount === 1 ? "miembro" : "miembros"}
        </span>
      </div>

      {group.description && (
        <p className="text-xs leading-5 text-[var(--muted)]">{group.description}</p>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Código de invitación
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <code className="font-mono text-base font-semibold tracking-[0.2em]">{group.inviteCode}</code>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 text-[11px] font-medium text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">
          Compártelo con tus compañeros para que puedan unirse.
        </p>
      </section>

      <section>
        <h3 className="text-xs font-semibold">Miembros</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {group.members.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] px-2.5 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-[10px] font-semibold text-white">
                {member.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{member.name}</p>
                <p className="text-[10px] text-[var(--muted)]">
                  {member.role === "owner" ? "Creador" : "Miembro"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <GroupChat groupId={group.id} isOwner={isOwner} />

      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold">Próximas sesiones</h3>
          {isOwner && !sessionOpen && (
            <button
              type="button"
              onClick={() => setSessionOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
            >
              <Plus size={13} /> Programar
            </button>
          )}
        </div>

        {sessionOpen && (
          <SessionForm onSubmit={addSession} onCancel={() => setSessionOpen(false)} />
        )}

        {group.sessions.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {group.sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{session.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} /> {formatSession(session.startsAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} /> {durationLabel(session.durationMinutes)}
                    </span>
                  </p>
                  {session.location && (
                    <p className="mt-1 truncate text-[10px] text-[var(--muted)]">{session.location}</p>
                  )}
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removeSession(session.id)}
                    disabled={busy}
                    aria-label={`Eliminar sesión ${session.title}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-[11px] text-[var(--muted)]">
            Todavía no hay sesiones programadas.
          </p>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          Cerrar
        </button>
        {isOwner ? (
          <button
            type="button"
            onClick={deleteGroup}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-400/20 px-3 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
          >
            <Trash2 size={13} /> {busy ? "Eliminando..." : "Eliminar grupo"}
          </button>
        ) : (
          <button
            type="button"
            onClick={leaveGroup}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-400/20 px-3 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
          >
            <LogOut size={13} /> {busy ? "Saliendo..." : "Salir del grupo"}
          </button>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group, onOpen }: { group: StudyGroup; onOpen: () => void }) {
  const extraMembers = Math.max(group.memberCount - group.members.length, 0);

  return (
    <article className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-violet-400/25">
      <div className="flex items-start gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${group.accent} text-white`}>
          <UsersRound size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{group.name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-[var(--accent)]">{group.subject}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[9px] font-medium text-[var(--muted)]">
          {group.role === "owner" ? "Creador" : "Miembro"}
        </span>
      </div>

      {group.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{group.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          {group.members.map((member, index) => (
            <span
              key={member.id}
              title={member.name}
              className={`grid size-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-gradient-to-br ${group.accent} text-[9px] font-semibold text-white ${index > 0 ? "-ml-2" : ""}`}
            >
              {member.initials}
            </span>
          ))}
          {extraMembers > 0 && (
            <span className="-ml-2 grid size-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-white/10 text-[9px] font-medium text-[var(--muted)]">
              +{extraMembers}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--muted)]">
          {group.memberCount} {group.memberCount === 1 ? "miembro" : "miembros"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted)]">
        <CalendarDays size={14} />
        {group.nextSession ? (
          <>
            Próxima sesión: <span className="text-[var(--foreground)]">{formatSession(group.nextSession.startsAt)}</span>
          </>
        ) : (
          <span>Sin sesiones programadas</span>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
      >
        Abrir grupo
      </button>
    </article>
  );
}

export function GroupsPage() {
  const { user } = useAuth();
  const canUse = hasCapability(user, "groups");
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [detailStatus, setDetailStatus] = useState<LoadStatus>("loading");
  const [detailError, setDetailError] = useState("");
  const [detailReloadKey, setDetailReloadKey] = useState(0);

  const loadGroups = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await api.groups.list();
      setGroups(result.groups);
      setStatus("ready");
    } catch (loadError) {
      setError(messageFor(loadError, "No pudimos cargar tus grupos."));
      setStatus("error");
    }
  }, []);

  const refreshGroups = useCallback(async () => {
    try {
      const result = await api.groups.list();
      setGroups(result.groups);
    } catch (refreshError) {
      setError(messageFor(refreshError, "No pudimos actualizar tus grupos."));
    }
  }, []);

  useEffect(() => {
    if (canUse) {
      void loadGroups();
    } else {
      setGroups([]);
      setStatus("ready");
    }
  }, [canUse, loadGroups]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedGroup(null);
      setDetailStatus("loading");
      return;
    }

    let active = true;
    setDetailStatus("loading");
    setDetailError("");

    api.groups
      .get(selectedId)
      .then(({ group }) => {
        if (!active) return;
        setSelectedGroup(group);
        setDetailStatus("ready");
      })
      .catch((loadError) => {
        if (!active) return;
        setDetailError(messageFor(loadError, "No pudimos cargar el grupo."));
        setDetailStatus("error");
      });

    return () => {
      active = false;
    };
  }, [selectedId, detailReloadKey]);

  if (!canUse) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Grupos de estudio</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Crea espacios para estudiar en equipo, invita a tus compañeros y organicen sesiones.
          </p>
        </div>
        <PlanGate
          requiredPlan="kiday-academy"
          title="Estudiar en equipo es parte de Kiday Academy"
          description="Desbloquea grupos ilimitados, sesiones compartidas, chat interno y moderación para organizar tu estudio con tus compañeros."
          benefits={[
            "Grupos con código de invitación",
            "Sesiones y recordatorios compartidos",
            "Chat interno del grupo",
            "Roles de creador y moderación",
          ]}
        />
      </div>
    );
  }

  async function createGroup(payload: GroupInput) {
    const { group } = await api.groups.create(payload);
    setEditor(null);
    await refreshGroups();
    setSelectedId(group.id);
  }

  async function joinGroup(code: string) {
    const { group } = await api.groups.join(code);
    setEditor(null);
    await refreshGroups();
    setSelectedId(group.id);
  }

  async function refreshSelectedGroup() {
    if (!selectedId) return;
    const { group } = await api.groups.get(selectedId);
    setSelectedGroup(group);
    setDetailStatus("ready");
  }

  async function handleGroupChanged() {
    await refreshSelectedGroup();
    await refreshGroups();
  }

  async function handleGroupRemoved() {
    setSelectedId(null);
    setSelectedGroup(null);
    await refreshGroups();
  }

  const memberTotal = groups.reduce((total, group) => total + group.memberCount, 0);
  const upcomingTotal = groups.filter((group) => group.nextSession).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Grupos de estudio</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Crea espacios para estudiar en equipo, invita a tus compañeros y organicen sesiones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditor("join")}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
          >
            <UserPlus size={16} /> Unirme con código
          </button>
          <button
            type="button"
            onClick={() => setEditor("create")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5"
          >
            <Plus size={16} /> Nuevo grupo
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Mis grupos</p>
          <p className="mt-2 text-2xl font-semibold">{groups.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Participaciones</p>
          <p className="mt-2 text-2xl font-semibold">{memberTotal}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Con próxima sesión</p>
          <p className="mt-2 text-2xl font-semibold">{upcomingTotal}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadGroups()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-2.5 py-1.5 font-medium transition hover:bg-rose-500/10"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      )}

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-52 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onOpen={() => setSelectedId(group.id)} />
          ))}
        </div>
      ) : status === "ready" ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-300">
            <UsersRound size={22} />
          </span>
          <h3 className="mt-3 text-sm font-semibold">Todavía no tienes grupos</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">
            Crea el primero y comparte el código con tus compañeros, o únete a uno que ya exista.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setEditor("create")}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus size={14} /> Crear grupo
            </button>
            <button
              type="button"
              onClick={() => setEditor("join")}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              <UserPlus size={14} /> Unirme con código
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        open={editor === "create"}
        onClose={() => setEditor(null)}
        title="Nuevo grupo de estudio"
        description="Crea el espacio, comparte el código y empiecen a organizarse."
      >
        <CreateGroupForm onSubmit={createGroup} onCancel={() => setEditor(null)} />
      </Modal>

      <Modal
        open={editor === "join"}
        onClose={() => setEditor(null)}
        title="Unirme a un grupo"
        description="Ingresa el código de invitación que te compartieron."
      >
        <JoinGroupForm onSubmit={joinGroup} onCancel={() => setEditor(null)} />
      </Modal>

      <Modal
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={selectedGroup?.name ?? "Grupo de estudio"}
        description={
          selectedGroup
            ? `${selectedGroup.subject} · ${selectedGroup.memberCount} ${selectedGroup.memberCount === 1 ? "miembro" : "miembros"}`
            : "Cargando información del grupo..."
        }
      >
        {detailStatus === "loading" && (
          <div className="mt-5 space-y-3">
            <div className="h-16 animate-pulse rounded-xl bg-white/5" />
            <div className="h-24 animate-pulse rounded-xl bg-white/5" />
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          </div>
        )}

        {detailStatus === "error" && (
          <div className="mt-5 rounded-xl bg-rose-500/10 px-4 py-4 text-center">
            <p className="text-xs text-rose-300">{detailError}</p>
            <button
              type="button"
              onClick={() => setDetailReloadKey((key) => key + 1)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-3 py-1.5 text-[11px] font-medium text-rose-300 transition hover:bg-rose-500/10"
            >
              <RefreshCw size={13} /> Reintentar
            </button>
          </div>
        )}

        {detailStatus === "ready" && selectedGroup && (
          <GroupDetail
            group={selectedGroup}
            onClose={() => setSelectedId(null)}
            onChanged={handleGroupChanged}
            onRemoved={handleGroupRemoved}
          />
        )}
      </Modal>
    </div>
  );
}
