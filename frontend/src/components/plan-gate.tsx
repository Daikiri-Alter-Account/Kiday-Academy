import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { PlanIcon } from "@/components/plan-icon";
import type { PlanSlug } from "@/lib/api";
import { getPlanMeta } from "@/lib/plans";

type PlanGateProps = {
  title: string;
  description: string;
  requiredPlan: PlanSlug;
  benefits: string[];
};

export function PlanGate({ title, description, requiredPlan, benefits }: PlanGateProps) {
  const plan = getPlanMeta(requiredPlan);

  return (
    <div className={`overflow-hidden rounded-3xl border p-6 sm:p-10 ${plan.cardClass}`}>
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] p-2">
          <PlanIcon service={{ slug: plan.slug }} className="size-full" />
        </span>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Disponible en {plan.name}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
        <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2.5 text-xs">
              <Sparkles size={13} className="shrink-0 text-[var(--accent)]" />
              {benefit}
            </div>
          ))}
        </div>
        <Link
          to="/app/planes"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5"
        >
          Ver planes <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
