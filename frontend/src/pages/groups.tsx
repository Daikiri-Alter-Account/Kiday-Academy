import { CalendarDays, Plus, UsersRound } from "lucide-react";
import { studyGroups } from "@/data/mock";

export function GroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Grupos de estudio</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Aprende en equipo, comparte apuntes y preparen juntos sus exámenes.</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5">
          <Plus size={16} /> Crear grupo
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {studyGroups.map((group) => (
          <article key={group.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-violet-400/25">
            <div className="flex items-start gap-3">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${group.accent} text-white`}>
                <UsersRound size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{group.name}</h3>
                <p className="mt-0.5 truncate text-[11px] text-[var(--accent)]">{group.subject}</p>
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{group.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                {group.members.map((member, index) => (
                  <span
                    key={member}
                    className={`grid size-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-gradient-to-br ${group.accent} text-[9px] font-semibold text-white ${index > 0 ? "-ml-2" : ""}`}
                  >
                    {member}
                  </span>
                ))}
                <span className="-ml-2 grid size-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-white/10 text-[9px] font-medium text-[var(--muted)]">
                  +{group.memberCount - group.members.length}
                </span>
              </div>
              <span className="text-[10px] text-[var(--muted)]">{group.memberCount} miembros</span>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted)]">
              <CalendarDays size={14} /> Próxima sesión: <span className="text-[var(--foreground)]">{group.nextSession}</span>
            </div>

            <button type="button" className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground)] transition hover:border-violet-400/40 hover:bg-violet-500/10">
              Abrir grupo
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
