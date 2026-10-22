import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  GraduationCap,
  Layers3,
  Plus,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

const subjects = [
  { name: "Cálculo diferencial", detail: "Parcial 2 · 4 actividades", color: "from-violet-500 to-indigo-500", icon: "∫" },
  { name: "Biología celular", detail: "Quiz · mañana, 9:00 a. m.", color: "from-emerald-400 to-teal-500", icon: "◉" },
  { name: "Historia universal", detail: "Proyecto · en 3 días", color: "from-amber-400 to-orange-500", icon: "✳" },
];

export function Hero() {
  return (
    <section id="inicio" className="relative isolate px-5 pb-20 pt-32 sm:px-8 sm:pt-36 lg:pb-28 lg:pt-40">
      <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 -z-20 h-[700px] opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[-240px] -z-10 h-[540px] w-[900px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[130px]" />
      <div className="pointer-events-none absolute left-[10%] top-[470px] -z-10 size-64 rounded-full bg-indigo-600/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3.5 py-2 text-xs font-medium text-violet-200 shadow-[0_0_35px_rgba(139,92,246,0.1)] sm:text-sm">
            <Sparkles size={15} className="text-violet-300" />
            Tu espacio de estudio, ahora con superpoderes
            <span className="ml-1 rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">IA</span>
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-[var(--foreground)] sm:text-6xl lg:text-[72px]">
            Todo lo que necesitas para estudiar, <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">en un solo lugar.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
            Organiza tus materias, calcula tus notas, estudia en grupo y aprende con IA. Kiday Studio te acompaña en el colegio, la universidad y cada nuevo reto.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="#registro" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-[0_8px_35px_rgba(109,40,217,0.28)] transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_12px_40px_rgba(109,40,217,0.38)]">
              <Sparkles size={17} /> Comenzar ahora, es gratis <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
            <Link href="#funcionalidades" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white/[0.03] px-6 text-sm font-semibold text-[var(--foreground)] transition hover:border-white/20 hover:bg-white/[0.07]">
              Explorar funciones
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-400" /> Gratis para empezar</span>
            <span className="hidden size-1 rounded-full bg-slate-700 sm:block" />
            <span>Sin tarjeta de crédito</span>
          </div>
        </div>

        <div id="funcionalidades" className="relative mx-auto mt-14 max-w-5xl sm:mt-20">
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-r from-violet-600/20 via-indigo-500/10 to-fuchsia-500/15 blur-2xl sm:-inset-8" />
          <div className="theme-panel overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:rounded-[24px]">
            <div className="flex h-12 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 sm:px-5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-[#ff625a]" /><span className="size-2.5 rounded-full bg-[#ffc04d]" /><span className="size-2.5 rounded-full bg-[#35c96f]" />
              </div>
              <div className="hidden items-center gap-2 rounded-md border border-white/[0.06] bg-black/20 px-12 py-1 text-[10px] text-slate-500 sm:flex">app.kiday.studio</div>
              <div className="flex items-center gap-3 text-slate-500"><Bell size={15} /><span className="size-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600" /></div>
            </div>

            <div className="grid min-h-[390px] md:grid-cols-[205px_1fr]">
              <aside className="hidden border-r border-[var(--border)] bg-[var(--surface-sidebar)] p-4 md:block">
                <div className="mb-6 flex items-center gap-2 px-1"><span className="grid size-7 place-items-center rounded-lg bg-violet-500/15 text-violet-300"><GraduationCap size={16} /></span><span className="text-xs font-semibold text-slate-200">Mi espacio</span><ChevronDown size={13} className="ml-auto text-slate-500" /></div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-2.5 py-2.5 font-medium text-violet-200"><Layers3 size={15} /> Panel principal</div>
                  <div className="flex items-center gap-2 px-2.5 py-2.5 text-slate-500"><BookOpen size={15} /> Mis materias</div>
                  <div className="flex items-center gap-2 px-2.5 py-2.5 text-slate-500"><UsersRound size={15} /> Grupos de estudio</div>
                </div>
                <div className="mb-2 mt-8 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">Herramientas</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 px-2.5 py-2 text-slate-500"><Sparkles size={14} /> Asistente IA</div>
                  <div className="flex items-center gap-2 px-2.5 py-2 text-slate-500"><CircleHelp size={14} /> Promediador</div>
                </div>
                <div className="mt-10 rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/[0.12] to-indigo-500/[0.06] p-3"><div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-violet-200"><Sparkles size={12} /> Kiday IA</div><p className="text-[9px] leading-4 text-slate-500">¿En qué tema quieres avanzar hoy?</p></div>
              </aside>

              <div className="mock-scrollbar overflow-hidden p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div><div className="text-[10px] text-slate-500 sm:text-xs">Miércoles, 22 de octubre</div><h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">¡Hola, estudiante! <span aria-hidden="true">👋</span></h2><p className="mt-1 text-[10px] text-slate-500 sm:text-xs">Este es tu resumen para hoy.</p></div>
                  <button type="button" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] text-slate-300 sm:px-3 sm:text-xs"><Plus size={13} /> Nueva materia</button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-black/[0.025] p-3 sm:p-4"><div className="flex items-center justify-between text-[9px] text-[var(--muted)] sm:text-[10px]">Promedio actual<span className="grid size-6 place-items-center rounded-lg bg-emerald-400/10 text-emerald-600"><GraduationCap size={13} /></span></div><div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">4.2<span className="text-sm text-[var(--muted)]"> / 5.0</span></div><div className="mt-2 text-[9px] text-emerald-600 sm:text-[10px]">↗ 0.3 este periodo</div></div>
                  <div className="rounded-xl border border-[var(--border)] bg-black/[0.025] p-3 sm:p-4"><div className="flex items-center justify-between text-[9px] text-[var(--muted)] sm:text-[10px]">Horas de estudio<span className="grid size-6 place-items-center rounded-lg bg-blue-400/10 text-blue-600"><Clock3 size={13} /></span></div><div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">12.5<span className="text-sm text-[var(--muted)]"> h</span></div><div className="mt-2 text-[9px] text-[var(--muted)] sm:text-[10px]">Esta semana</div></div>
                  <div className="col-span-2 rounded-xl border border-[var(--border)] bg-black/[0.025] p-3 sm:col-span-1 sm:p-4"><div className="flex items-center justify-between text-[9px] text-[var(--muted)] sm:text-[10px]">Racha de estudio<span className="grid size-6 place-items-center rounded-lg bg-amber-400/10 text-amber-600">✦</span></div><div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">7 días</div><div className="mt-2 text-[9px] text-amber-600 sm:text-[10px]">¡Sigue así! 🔥</div></div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-xl border border-[var(--border)] bg-black/[0.025] p-3.5 sm:p-4">
                    <div className="mb-3 flex items-center justify-between"><div><h3 className="text-xs font-semibold text-slate-200 sm:text-sm">Tus materias</h3><p className="mt-0.5 text-[9px] text-slate-600">Mantén todo bajo control</p></div><button type="button" aria-label="Buscar materia" className="text-slate-500"><Search size={15} /></button></div>
                    <div className="space-y-2">
                      {subjects.map((subject) => <div key={subject.name} className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-black/10 p-2"><span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${subject.color} text-xs font-bold text-white`}>{subject.icon}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-medium text-slate-300 sm:text-xs">{subject.name}</span><span className="mt-0.5 block truncate text-[9px] text-slate-600">{subject.detail}</span></span><span className="hidden rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] text-emerald-300 sm:block">Al día</span></div>)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-black/[0.025] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-200 sm:text-sm">Tu semana</h3><span className="text-[9px] text-slate-600">Esta semana</span></div>
                    <div className="mt-5 flex h-[82px] items-end justify-between gap-2 px-1">
                      {[38, 58, 46, 78, 57, 88, 30].map((height, index) => <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"><div className={`w-full max-w-5 rounded-t-md ${index === 5 ? "bg-gradient-to-t from-violet-700 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.25)]" : "bg-violet-400/20"}`} style={{ height: `${height}%` }} /><span className="text-[8px] text-slate-600">{["L", "M", "X", "J", "V", "S", "D"][index]}</span></div>)}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[9px]"><span className="text-slate-600">Meta semanal</span><span className="text-slate-300">12.5 <span className="text-slate-600">/ 15 h</span></span></div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full w-[83%] rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" /></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-violet-400/10 bg-gradient-to-r from-violet-500/[0.08] to-indigo-500/[0.04] px-3 py-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-300"><Sparkles size={14} /></span><p className="min-w-0 flex-1 truncate text-[9px] text-slate-400 sm:text-[10px]">Tu siguiente parcial es Cálculo diferencial. ¿Repasamos juntos?</p><ArrowRight size={14} className="shrink-0 text-violet-300" /></div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600"><span className="size-1.5 rounded-full bg-emerald-400" /> Una vista previa de tu espacio de estudio</div>
        </div>

        <div id="contacto" className="sr-only">Contacto de Kiday Studio</div>
      </div>
    </section>
  );
}
