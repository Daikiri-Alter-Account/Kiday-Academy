import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  LibraryBig,
  Link2,
  ListChecks,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/modal";
import { api, type MaterialInput, type MaterialItem, type MaterialType } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getPlanMeta, hasCapability } from "@/lib/plans";
import { useStudy } from "@/lib/study-store";

type LoadStatus = "loading" | "ready" | "error";
type Editor = { mode: "create" } | { mode: "edit"; material: MaterialItem } | null;

const typeMeta: Record<MaterialType, { label: string; icon: LucideIcon; className: string }> = {
  apunte: { label: "Apunte", icon: FileText, className: "bg-violet-400/10 text-violet-200" },
  pdf: { label: "PDF", icon: FileText, className: "bg-rose-400/10 text-rose-200" },
  video: { label: "Video", icon: Video, className: "bg-sky-400/10 text-sky-200" },
  enlace: { label: "Enlace", icon: Link2, className: "bg-emerald-400/10 text-emerald-200" },
  ejercicio: { label: "Ejercicio", icon: ListChecks, className: "bg-amber-400/10 text-amber-200" },
  libro: { label: "Libro", icon: BookOpen, className: "bg-teal-400/10 text-teal-200" },
};

const typeOptions = Object.entries(typeMeta) as [MaterialType, (typeof typeMeta)[MaterialType]][];

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function MaterialForm({
  initial,
  subjects,
  onSubmit,
  onCancel,
}: {
  initial?: MaterialItem;
  subjects: { id: string; name: string }[];
  onSubmit: (payload: MaterialInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [type, setType] = useState<MaterialType>(initial?.type ?? "enlace");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle) {
      setError("Escribe un título para el material.");
      return;
    }

    let normalizedUrl: string;
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      normalizedUrl = parsed.toString();
    } catch {
      setError("Ingresa un enlace válido que comience con http:// o https://.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        url: normalizedUrl,
        type,
        subjectId: subjectId || null,
        description: description.trim(),
      });
    } catch (submitError) {
      setError(messageFor(submitError, "No pudimos guardar el material."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="material-title" className="mb-1.5 block text-xs font-medium">
          Título
        </label>
        <input
          id="material-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={140}
          placeholder="Ej. Formulario de derivadas"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
      </div>

      <div>
        <label htmlFor="material-url" className="mb-1.5 block text-xs font-medium">
          Enlace
        </label>
        <input
          id="material-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          maxLength={500}
          placeholder="https://..."
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
        />
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          Puedes guardar apuntes, PDF, videos o cualquier recurso con URL.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="material-type" className="mb-1.5 block text-xs font-medium">
            Tipo
          </label>
          <select
            id="material-type"
            value={type}
            onChange={(event) => setType(event.target.value as MaterialType)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          >
            {typeOptions.map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="material-subject" className="mb-1.5 block text-xs font-medium">
            Materia
          </label>
          <select
            id="material-subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          >
            <option value="">Sin materia</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="material-description" className="mb-1.5 block text-xs font-medium">
          Descripción <span className="font-normal text-[var(--muted)]">(opcional)</span>
        </label>
        <textarea
          id="material-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="¿Qué encuentras en este recurso?"
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
          disabled={saving}
          className="h-10 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : initial ? "Guardar cambios" : "Agregar material"}
        </button>
      </div>
    </form>
  );
}

export function MaterialsPage() {
  const { user } = useAuth();
  const { subjects } = useStudy();
  const plan = getPlanMeta(user?.plan);
  const canUse = hasCapability(user, "materials");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | MaterialType>("todos");
  const [subjectFilter, setSubjectFilter] = useState("todas");
  const [editor, setEditor] = useState<Editor>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await api.materials.list();
      setMaterials(result.materials);
      setStatus("ready");
    } catch (loadError) {
      setError(messageFor(loadError, "No pudimos cargar tu biblioteca."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (canUse) void loadMaterials();
  }, [canUse, loadMaterials]);

  useEffect(() => {
    if (subjectFilter !== "todas" && subjectFilter !== "sin" && !subjects.some((subject) => subject.id === subjectFilter)) {
      setSubjectFilter("todas");
    }
  }, [subjectFilter, subjects]);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );

  const visibleMaterials = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return materials.filter((material) => {
      const matchesType = typeFilter === "todos" || material.type === typeFilter;
      const matchesSubject =
        subjectFilter === "todas"
          ? true
          : subjectFilter === "sin"
            ? !material.subjectId
            : material.subjectId === subjectFilter;
      const matchesQuery =
        !normalized ||
        material.title.toLowerCase().includes(normalized) ||
        material.description.toLowerCase().includes(normalized) ||
        hostOf(material.url).toLowerCase().includes(normalized);
      return matchesType && matchesSubject && matchesQuery;
    });
  }, [materials, query, subjectFilter, typeFilter]);

  const coveredSubjects = new Set(materials.map((material) => material.subjectId).filter(Boolean)).size;
  const typeCount = new Set(materials.map((material) => material.type)).size;
  const filtersActive = query.trim() !== "" || typeFilter !== "todos" || subjectFilter !== "todas";

  async function handleSave(payload: MaterialInput) {
    if (editor?.mode === "edit") {
      const { material } = await api.materials.update(editor.material.id, payload);
      setMaterials((current) => current.map((item) => (item.id === material.id ? material : item)));
    } else {
      const { material } = await api.materials.create(payload);
      setMaterials((current) => [material, ...current]);
    }
    setEditor(null);
  }

  async function handleDelete(material: MaterialItem) {
    if (!window.confirm(`¿Eliminar "${material.title}" de tu biblioteca?`)) return;

    setError("");
    setDeletingId(material.id);
    try {
      await api.materials.deleteMaterial(material.id);
      setMaterials((current) => current.filter((item) => item.id !== material.id));
    } catch (deleteError) {
      setError(messageFor(deleteError, "No pudimos eliminar el material."));
    } finally {
      setDeletingId(null);
    }
  }

  if (!canUse) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Biblioteca de materiales</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Guarda apuntes, ejercicios, videos y enlaces importantes por materia.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.1] via-[var(--surface)] to-[var(--surface)] p-6 sm:p-10">
          <div className="mx-auto max-w-xl text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-200">
              <LockKeyhole size={24} />
            </span>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
              {plan.name}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">
              La biblioteca de materiales es parte de Kiday Pro
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Organiza todos tus recursos de estudio en un solo lugar, relaciónalos con tus materias y
              encuéntralos cuando los necesites.
            </p>
            <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
              {[
                "Apuntes, PDF, videos y enlaces",
                "Filtros por materia y tipo",
                "Búsqueda instantánea",
                "Biblioteca personal persistente",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2.5 text-xs">
                  <Sparkles size={13} className="shrink-0 text-amber-200" />
                  {benefit}
                </div>
              ))}
            </div>
            <Link
              to="/app/planes"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-950/30 transition hover:-translate-y-0.5"
            >
              Ver planes <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Biblioteca de materiales</h2>
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-200">
              {plan.shortName}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tus apuntes, recursos y enlaces importantes, organizados por materia.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: "create" })}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5"
        >
          <Plus size={16} /> Nuevo material
        </button>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{error}</span>
          {status === "error" && (
            <button
              type="button"
              onClick={() => void loadMaterials()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-2.5 py-1.5 font-medium transition hover:bg-rose-500/10"
            >
              <RefreshCw size={13} /> Reintentar
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Materiales guardados</p>
          <p className="mt-2 text-2xl font-semibold">{materials.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Materias cubiertas</p>
          <p className="mt-2 text-2xl font-semibold">{coveredSubjects}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] text-[var(--muted)]">Tipos de recurso</p>
          <p className="mt-2 text-2xl font-semibold">{typeCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar materiales</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, descripción o sitio..."
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-xs outline-none transition focus:border-violet-400/50"
          />
        </label>
        <div className="flex gap-2">
          <label className="flex-1 sm:flex-none">
            <span className="sr-only">Filtrar por tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "todos" | MaterialType)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs outline-none transition focus:border-violet-400/50 sm:w-40"
            >
              <option value="todos">Todos los tipos</option>
              {typeOptions.map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 sm:flex-none">
            <span className="sr-only">Filtrar por materia</span>
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs outline-none transition focus:border-violet-400/50 sm:w-44"
            >
              <option value="todas">Todas las materias</option>
              <option value="sin">Sin materia</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {status === "loading" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : visibleMaterials.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleMaterials.map((material) => {
            const meta = typeMeta[material.type];
            const Icon = meta.icon;
            const subject = material.subjectId ? subjectById.get(material.subjectId) : null;
            return (
              <article
                key={material.id}
                className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-violet-400/25 hover:bg-white/[0.02]"
              >
                <div className="flex items-start gap-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${meta.className}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5">{material.title}</h3>
                      <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEditor({ mode: "edit", material })}
                          aria-label={`Editar ${material.title}`}
                          className="grid size-7 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(material)}
                          disabled={deletingId === material.id}
                          aria-label={`Eliminar ${material.title}`}
                          className="grid size-7 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      {meta.label}
                      {subject ? ` · ${subject.name}` : " · Sin materia"}
                    </p>
                  </div>
                </div>

                {material.description && (
                  <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-[var(--muted)]">{material.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="truncate text-[10px] text-[var(--muted)]">{hostOf(material.url)}</span>
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
                  >
                    Abrir <ExternalLink size={11} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-400/10 text-violet-200">
            <LibraryBig size={22} />
          </span>
          <h3 className="mt-4 text-sm font-semibold">
            {filtersActive ? "No encontramos materiales con esos filtros" : "Tu biblioteca está vacía"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">
            {filtersActive
              ? "Prueba con otra búsqueda o limpia los filtros para ver todos tus recursos."
              : "Agrega tu primer apunte, video o enlace y mantenlo siempre a mano."}
          </p>
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTypeFilter("todos");
                setSubjectFilter("todas");
              }}
              className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditor({ mode: "create" })}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-[11px] font-semibold text-white transition hover:brightness-110"
            >
              <Plus size={13} /> Agregar material
            </button>
          )}
        </div>
      )}

      <Modal
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Editar material" : "Nuevo material"}
        description="Guarda un enlace a tus apuntes, videos, PDF o ejercicios."
      >
        {editor && (
          <MaterialForm
            initial={editor.mode === "edit" ? editor.material : undefined}
            subjects={subjects}
            onSubmit={handleSave}
            onCancel={() => setEditor(null)}
          />
        )}
      </Modal>
    </div>
  );
}
