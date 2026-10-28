import { useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";

type GradeRow = {
  id: string;
  name: string;
  grade: number;
  weight: number;
};

const initialRows: GradeRow[] = [
  { id: "p1", name: "Parcial 1", grade: 4.2, weight: 30 },
  { id: "talleres", name: "Talleres", grade: 4.6, weight: 30 },
  { id: "p2", name: "Parcial 2", grade: 3.8, weight: 40 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AveragerPage() {
  const [rows, setRows] = useState<GradeRow[]>(initialRows);

  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const weightedSum = rows.reduce((sum, row) => sum + row.grade * row.weight, 0);
  const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const progress = Math.min(100, (average / 5) * 100);

  const message =
    rows.length === 0
      ? "Agrega una actividad para empezar a calcular."
      : average >= 4
        ? "Excelente, vas por muy buen camino."
        : average >= 3
          ? "Vas bien, aún hay margen para subir."
          : "Necesitas reforzar antes del próximo corte.";

  function updateRow(id: string, patch: Partial<GradeRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { id: crypto.randomUUID(), name: `Actividad ${current.length + 1}`, grade: 0, weight: 0 },
    ]);
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Promediador</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Calcula tu nota final con los pesos de cada actividad.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Actividades del curso</h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">Notas sobre 5.0 y pesos en porcentaje.</p>
            </div>
            <button type="button" onClick={addRow} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:border-violet-400/40 hover:bg-violet-500/10">
              <Plus size={14} /> Agregar
            </button>
          </div>

          <div className="hidden grid-cols-[1fr_90px_90px_36px] gap-3 px-1 pb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] sm:grid">
            <span>Actividad</span>
            <span>Nota</span>
            <span>Peso</span>
            <span className="sr-only">Acciones</span>
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_36px] items-center gap-2 rounded-xl border border-[var(--border)] bg-black/10 p-2 sm:grid-cols-[1fr_90px_90px_36px] sm:gap-3">
                <input
                  type="text"
                  value={row.name}
                  onChange={(event) => updateRow(row.id, { name: event.target.value })}
                  aria-label="Nombre de la actividad"
                  className="h-9 min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-xs text-[var(--foreground)] outline-none transition hover:border-[var(--border)] focus:border-violet-400/50"
                />
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={row.grade}
                  onChange={(event) => updateRow(row.id, { grade: clamp(Number(event.target.value) || 0, 0, 5) })}
                  aria-label={`Nota de ${row.name}`}
                  className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-violet-400/50"
                />
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={row.weight}
                    onChange={(event) => updateRow(row.id, { weight: clamp(Number(event.target.value) || 0, 0, 100) })}
                    aria-label={`Peso de ${row.name}`}
                    className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-violet-400/50"
                  />
                  <span className="text-[10px] text-[var(--muted)]">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label={`Eliminar ${row.name}`}
                  className="col-start-2 row-start-1 grid size-9 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300 sm:col-start-auto sm:row-start-auto"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-xs text-[var(--muted)]">
              Agrega una actividad para empezar a calcular.
            </p>
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.12] to-indigo-500/[0.05] p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <span className="grid size-8 place-items-center rounded-lg bg-violet-400/10 text-[var(--accent)]">
                <Calculator size={16} />
              </span>
              Promedio ponderado
            </div>
            <div className="mt-4 text-4xl font-semibold tracking-tight">
              {average.toFixed(2)}
              <span className="ml-1 text-sm font-normal text-[var(--muted)]">/ 5.00</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--track)]">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">{message}</p>

            <dl className="mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-[11px]">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--muted)]">Actividades</dt>
                <dd>{rows.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--muted)]">Peso acumulado</dt>
                <dd className={totalWeight === 100 ? "text-emerald-300" : "text-amber-300"}>{totalWeight}%</dd>
              </div>
            </dl>

            {totalWeight !== 100 && (
              <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-[10px] leading-4 text-amber-200">
                Los pesos suman {totalWeight}%. Ajusta las actividades para completar el 100% del curso.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
