import type { AuthUser, PlanSlug } from "@/lib/api";

type PlanMeta = {
  slug: PlanSlug;
  name: string;
  shortName: string;
  sidebarTagline: string;
  badgeClass: string;
  cardClass: string;
};

export const PLAN_META: Record<PlanSlug, PlanMeta> = {
  "kiday-free": {
    slug: "kiday-free",
    name: "Kiday Free",
    shortName: "Free",
    sidebarTagline: "Tu base académica",
    badgeClass: "border-violet-400/20 bg-violet-500/10",
    cardClass: "border-violet-400/10 bg-gradient-to-br from-violet-500/[0.12] to-indigo-500/[0.06]",
  },
  "kiday-pro": {
    slug: "kiday-pro",
    name: "Kiday Pro",
    shortName: "Pro",
    sidebarTagline: "Asistente IA y materiales",
    badgeClass: "border-amber-400/25 bg-amber-400/10",
    cardClass: "border-amber-400/15 bg-gradient-to-br from-amber-500/[0.12] to-orange-500/[0.06]",
  },
  "kiday-academy": {
    slug: "kiday-academy",
    name: "Kiday Academy",
    shortName: "Academy",
    sidebarTagline: "Todo desbloqueado",
    badgeClass: "border-sky-400/25 bg-sky-400/10",
    cardClass: "border-sky-400/15 bg-gradient-to-br from-sky-500/[0.12] to-indigo-500/[0.06]",
  },
};

export function getPlanMeta(plan: PlanSlug | null | undefined) {
  return PLAN_META[plan ?? "kiday-free"];
}

export function hasCapability(user: AuthUser | null, capability: string) {
  return user?.capabilities.includes(capability) ?? false;
}
