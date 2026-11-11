import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Check, RefreshCw, Sparkles } from "lucide-react";
import { PlanIcon } from "@/components/plan-icon";
import { api, type PlanSlug, type Service } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  CAPABILITY_LABELS,
  PLAN_CAPABILITIES,
  PLAN_META,
  PLAN_ORDER,
  getPlanMeta,
  planRank,
} from "@/lib/plans";

type LoadStatus = "loading" | "ready" | "error";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function priceLabel(service: Service) {
  if (service.price === 0) return "Gratis";
  return currencyFormatter.format(service.price).replace("COP", "").trim();
}

function isPlanSlug(value: string): value is PlanSlug {
  return PLAN_ORDER.includes(value as PlanSlug);
}

export function PlansPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await api.services();
      setServices(result.services);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar los planes.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const plans = useMemo(
    () =>
      services
        .filter((service) => isPlanSlug(service.slug))
        .sort((a, b) => planRank(a.slug as PlanSlug) - planRank(b.slug as PlanSlug)),
    [services],
  );

  const currentPlan = user?.role === "student" ? user.plan : null;
  const currentMeta = getPlanMeta(currentPlan);
  const currentRank = currentPlan ? planRank(currentPlan) : -1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Planes</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Compara lo que desbloquea cada plan y solicita el cambio cuando lo necesites.
        </p>
      </div>

      {user?.role === "admin" ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          Estás viendo esta página como administrador. Los planes aplican a las cuentas de estudiante.
        </div>
      ) : (
        <section className={`rounded-2xl border p-4 sm:p-5 ${currentMeta.cardClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-white/[0.06] p-1.5">
                <PlanIcon service={{ slug: currentMeta.slug }} className="size-full" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Tu plan actual
                </p>
                <p className="mt-0.5 text-base font-semibold">{currentMeta.name}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              <BadgeCheck size={12} /> Activo
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(user?.capabilities ?? []).map((capability) => (
              <span key={capability} className="rounded-full border border-[var(--border)] bg-black/10 px-2.5 py-1 text-[10px] text-[var(--muted)]">
                {CAPABILITY_LABELS[capability] ?? capability}
              </span>
            ))}
            {(user?.capabilities ?? []).length === 0 && (
              <span className="text-[11px] text-[var(--muted)]">Esta cuenta no tiene capacidades de estudiante.</span>
            )}
          </div>
        </section>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadServices()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-2.5 py-1.5 font-medium transition hover:bg-rose-500/10"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      )}

      {status === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-96 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((service) => {
            const slug = service.slug as PlanSlug;
            const meta = PLAN_META[slug];
            const rank = planRank(slug);
            const isCurrent = currentPlan === slug;
            const included = currentRank >= 0 && rank <= currentRank;
            const ctaLabel = isCurrent
              ? "Tu plan actual"
              : included
                ? "Incluido en tu plan"
                : currentPlan
                  ? "Solicitar mejora"
                  : "Solicitar información";

            return (
              <article
                key={service.id}
                className={`relative flex flex-col rounded-2xl border p-5 ${meta.cardClass} ${
                  isCurrent ? "ring-2 ring-emerald-400/40" : ""
                }`}
              >
                {service.highlighted && (
                  <span className="absolute right-4 top-4 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-200">
                    Recomendado
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-white/[0.06] p-1.5">
                    <PlanIcon service={{ slug }} className="size-full" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{meta.name}</h3>
                    <p className="text-[10px] text-[var(--muted)]">{meta.sidebarTagline}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-2xl font-semibold tracking-tight">{priceLabel(service)}</p>
                  {service.price > 0 && (
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">por {service.period ?? "mes"}</p>
                  )}
                </div>

                <p className="mt-4 text-[11px] leading-5 text-[var(--muted)]">{service.tagline}</p>

                <ul className="mt-4 flex-1 space-y-2">
                  {PLAN_CAPABILITIES[slug].map((capability) => (
                    <li key={capability} className="flex items-start gap-2 text-[11px]">
                      <Check size={13} className="mt-0.5 shrink-0 text-emerald-300" />
                      {CAPABILITY_LABELS[capability] ?? capability}
                    </li>
                  ))}
                </ul>

                {isCurrent || included ? (
                  <span className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted)]">
                    {ctaLabel}
                  </span>
                ) : (
                  <Link
                    to="/#contacto"
                    className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-semibold text-white transition hover:brightness-110"
                  >
                    {ctaLabel} <ArrowRight size={13} />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.1] to-indigo-500/[0.04] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-200">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold">¿No sabes qué plan elegir?</h3>
              <p className="mt-1 max-w-lg text-[11px] leading-5 text-[var(--muted)]">
                Cuéntanos cómo estudias y te ayudamos a elegir. Los cambios de plan se gestionan por contacto
                mientras habilitamos el pago en línea.
              </p>
            </div>
          </div>
          <Link
            to="/#contacto"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3.5 py-2 text-[11px] font-medium text-violet-200 transition hover:bg-violet-500/20"
          >
            Hablar con Kiday <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
