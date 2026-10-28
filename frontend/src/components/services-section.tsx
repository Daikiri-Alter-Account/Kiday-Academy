import { Check, RefreshCw, Sparkles } from "lucide-react";
import type { Service } from "@/lib/api";

type ServicesSectionProps = {
  services: Service[];
  status: "loading" | "ready" | "error";
  error: string;
  onRetry: () => void;
  onSelectPlan: (planName: string) => void;
};

function formatPrice(service: Service) {
  if (service.price === 0) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: service.currency || "COP",
    maximumFractionDigits: 0,
  }).format(service.price);
}

export function ServicesSection({ services, status, error, onRetry, onSelectPlan }: ServicesSectionProps) {
  return (
    <section id="planes" className="relative px-5 py-20 sm:px-8 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-72 w-[720px] -translate-x-1/2 rounded-full bg-violet-700/10 blur-[120px]" />
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1.5 text-[11px] font-medium text-[var(--accent)]">
            <Sparkles size={13} /> Planes de Kiday Academy
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Elige cómo quieres <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">estudiar</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Desde lo esencial para organizarte hasta acompañamiento y comunidad para todo tu semestre.
          </p>
        </div>

        {status === "loading" && (
          <div className="mt-12 grid gap-4 md:grid-cols-3" aria-label="Cargando planes">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[360px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div role="alert" className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-6 text-center">
            <p className="text-sm font-medium">No pudimos cargar el catálogo de planes.</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium transition hover:bg-white/5"
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  service.highlighted
                    ? "border-violet-400/40 bg-gradient-to-b from-violet-500/[0.12] to-[var(--surface)] shadow-[0_20px_60px_rgba(124,58,237,0.15)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                {service.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Más popular
                  </span>
                )}

                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="mt-1 text-xs text-[var(--accent)]">{service.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight">{formatPrice(service)}</span>
                  {service.price > 0 && service.period && (
                    <span className="text-xs text-[var(--muted)]">/ {service.period}</span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{service.description}</p>

                <ul className="mt-5 space-y-2.5">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => onSelectPlan(service.name)}
                  className={`mt-6 inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold transition ${
                    service.highlighted
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/40 hover:-translate-y-0.5"
                      : "border border-[var(--border)] text-[var(--foreground)] hover:border-violet-400/40 hover:bg-violet-500/10"
                  }`}
                >
                  Quiero este plan
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
