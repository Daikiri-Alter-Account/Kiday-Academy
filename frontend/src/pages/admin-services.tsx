import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Loader2,
  Package,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { PlanIcon } from "@/components/plan-icon";
import {
  api,
  type Service,
  type ServicePayload,
} from "@/lib/api";

type ServiceForm = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: string;
  currency: string;
  period: string;
  features: string;
  highlighted: boolean;
  active: boolean;
  order: string;
};

type Editor = { mode: "create" } | { mode: "edit"; service: Service };

const emptyForm: ServiceForm = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  price: "0",
  currency: "COP",
  period: "mes",
  features: "",
  highlighted: false,
  active: true,
  order: "0",
};

function formatPrice(service: Service) {
  if (service.price === 0) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: service.currency || "COP",
    maximumFractionDigits: 0,
  }).format(service.price);
}

function toForm(service: Service): ServiceForm {
  return {
    name: service.name,
    slug: service.slug,
    tagline: service.tagline,
    description: service.description,
    price: String(service.price),
    currency: service.currency,
    period: service.period ?? "",
    features: service.features.join("\n"),
    highlighted: service.highlighted,
    active: service.active,
    order: String(service.order),
  };
}

export function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await api.admin.services();
      setServices(result.services);
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar el catálogo.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) setEditor(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saving]);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setEditor({ mode: "create" });
  }

  function openEdit(service: Service) {
    setForm(toForm(service));
    setFormError("");
    setEditor({ mode: "edit", service });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.tagline.trim() || !form.description.trim()) {
      setFormError("Nombre, tagline y descripción son obligatorios.");
      return;
    }

    const payload: ServicePayload = {
      name: form.name.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      currency: form.currency.trim() || "COP",
      period: form.period.trim() || null,
      features: form.features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      highlighted: form.highlighted,
      active: form.active,
      order: Number(form.order) || 0,
    };

    setSaving(true);
    try {
      if (editor?.mode === "edit") {
        await api.admin.updateService(editor.service.id, payload);
      } else {
        await api.admin.createService(payload);
      }
      await load();
      setEditor(null);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "No pudimos guardar el plan.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    setBusyId(service.id);
    setError("");
    try {
      const result = await api.admin.updateService(service.id, { active: !service.active });
      setServices((current) =>
        current.map((item) => (item.id === service.id ? result.service : item)),
      );
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No pudimos actualizar el plan.");
    } finally {
      setBusyId("");
    }
  }

  async function removeService(service: Service) {
    if (!window.confirm(`¿Eliminar el plan "${service.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setBusyId(service.id);
    setError("");
    try {
      await api.admin.deleteService(service.id);
      setServices((current) => current.filter((item) => item.id !== service.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No pudimos eliminar el plan.");
    } finally {
      setBusyId("");
    }
  }

  const editingService = editor?.mode === "edit" ? editor.service : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Planes y servicios</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Este catálogo se muestra en la página principal.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5"
        >
          <Plus size={16} /> Nuevo plan
        </button>
      </div>

      <div aria-live="polite">
        {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">{error}</p>}
      </div>

      {status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-52 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-6 text-center">
          <p className="text-sm font-medium">No pudimos cargar el catálogo.</p>
          <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium">
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      {status === "ready" && services.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
          <Package size={24} className="mx-auto text-[var(--muted)]" />
          <p className="mt-3 text-sm font-medium">Todavía no hay planes en el catálogo.</p>
          <button type="button" onClick={openCreate} className="mt-4 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium">
            Crear el primero
          </button>
        </div>
      )}

      {status === "ready" && services.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-white/[0.03] p-1.5">
                    <PlanIcon service={service} className="size-full" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{service.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--accent)]">{service.tagline}</p>
                    <code className="mt-1 block truncate text-[10px] text-[var(--muted)]">/{service.slug}</code>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-1 text-[9px] ${service.active ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-500/10 text-[var(--muted)]"}`}>
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                  {service.highlighted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-1 text-[9px] text-[var(--accent)]">
                      <Sparkles size={9} /> Popular
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-[var(--muted)]">{service.description}</p>

              <div className="mt-3 flex items-end justify-between border-t border-[var(--border)] pt-3">
                <span className="text-lg font-semibold">
                  {formatPrice(service)}
                  {service.price > 0 && service.period && (
                    <span className="ml-1 text-[10px] font-normal text-[var(--muted)]">/ {service.period}</span>
                  )}
                </span>
                <span className="text-[10px] text-[var(--muted)]">{service.features.length} beneficios</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(service)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-2 text-[10px] font-medium transition hover:border-violet-400/40 hover:bg-violet-500/10"
                >
                  <Pencil size={12} /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(service)}
                  disabled={busyId === service.id}
                  aria-label={service.active ? `Desactivar ${service.name}` : `Activar ${service.name}`}
                  className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-40"
                >
                  {busyId === service.id ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => removeService(service)}
                  disabled={busyId === service.id}
                  aria-label={`Eliminar ${service.name}`}
                  className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <button
            type="button"
            aria-label="Cerrar formulario"
            onClick={() => !saving && setEditor(null)}
            className="absolute inset-0"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-dialog-title"
            className="relative my-6 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="service-dialog-title" className="text-lg font-semibold">
                  {editingService ? "Editar plan" : "Nuevo plan"}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {editingService ? `Actualiza la información de ${editingService.name}.` : "Añade un plan o servicio al catálogo."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setEditor(null)}
                aria-label="Cerrar"
                className="grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Nombre</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    maxLength={120}
                    placeholder="Kiday Pro"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs outline-none focus:border-violet-400/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Slug (opcional)</span>
                  <input
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    maxLength={80}
                    placeholder="kiday-pro"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs outline-none focus:border-violet-400/60"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Tagline</span>
                <input
                  value={form.tagline}
                  onChange={(event) => setForm({ ...form, tagline: event.target.value })}
                  maxLength={160}
                  placeholder="Para estudiantes que quieren ir un paso adelante"
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs outline-none focus:border-violet-400/60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  maxLength={1200}
                  rows={3}
                  placeholder="Describe qué incluye y para quién es este plan..."
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs leading-5 outline-none focus:border-violet-400/60"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Precio</span>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs outline-none focus:border-violet-400/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Moneda</span>
                  <input
                    value={form.currency}
                    onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })}
                    maxLength={3}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs uppercase outline-none focus:border-violet-400/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Periodo</span>
                  <input
                    value={form.period}
                    onChange={(event) => setForm({ ...form, period: event.target.value })}
                    maxLength={40}
                    placeholder="mes"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs outline-none focus:border-violet-400/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Orden</span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={form.order}
                    onChange={(event) => setForm({ ...form, order: event.target.value })}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs outline-none focus:border-violet-400/60"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
                  Beneficios <span className="font-normal">uno por línea</span>
                </span>
                <textarea
                  value={form.features}
                  onChange={(event) => setForm({ ...form, features: event.target.value })}
                  rows={4}
                  placeholder={"Asistente IA sin límites\nComunidades y chats privados"}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs leading-5 outline-none focus:border-violet-400/60"
                />
              </label>

              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.highlighted}
                    onChange={(event) => setForm({ ...form, highlighted: event.target.checked })}
                    className="size-4 accent-violet-500"
                  />
                  Destacar como popular
                </label>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm({ ...form, active: event.target.checked })}
                    className="size-4 accent-violet-500"
                  />
                  Visible en el catálogo
                </label>
              </div>

              <div aria-live="polite">
                {formError && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">{formError}</p>}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => !saving && setEditor(null)}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-medium transition hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingService ? "Guardar cambios" : "Crear plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
