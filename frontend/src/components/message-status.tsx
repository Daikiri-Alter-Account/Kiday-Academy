import type { ContactMessage } from "@/lib/api";

export const messageStatusMeta: Record<
  ContactMessage["status"],
  { label: string; className: string }
> = {
  nuevo: { label: "Nuevo", className: "bg-violet-500/15 text-violet-300" },
  leido: { label: "Leído", className: "bg-sky-500/10 text-sky-300" },
  respondido: { label: "Respondido", className: "bg-emerald-500/10 text-emerald-300" },
};

export function MessageStatusBadge({ status }: { status: ContactMessage["status"] }) {
  const meta = messageStatusMeta[status];
  return <span className={`rounded-full px-2 py-1 text-[10px] ${meta.className}`}>{meta.label}</span>;
}
