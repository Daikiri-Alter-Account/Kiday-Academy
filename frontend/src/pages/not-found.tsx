import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] px-6 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-[var(--accent)]">
          <Compass size={26} />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Error 404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Esta página no existe</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Puede que el enlace haya cambiado o que la página esté en construcción.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition hover:bg-white/5">
            <ArrowLeft size={15} /> Volver al inicio
          </Link>
          <Link to="/app" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">
            Ir al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
