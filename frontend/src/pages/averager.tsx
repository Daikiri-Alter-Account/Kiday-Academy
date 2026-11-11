import { useCallback, useEffect, useState } from "react";
import { Calculator, Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import { api, type GradeItem } from "@/lib/api";
import { useStudy } from "@/lib/study-store";

type LoadStatus = "loading" | "ready" | "error";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AveragerPage() {
  const { subjects } = useStudy();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectReady, setSubjectReady] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadGrades = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await api.grades.list();
      setGrades(result.grades);
      setStatus("ready");
    } catch (loadError) {
      setError(messageFor(loadError, "No pudimos cargar tus notas."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadGrades();
  }, [loadGrades]);

  useEffect(() => {
    if (!subjectReady && subjects.length > 0) {
      setSubjectId(subjects[0].id);
      setSubjectReady(true);
    }
  }, [subjectReady, subjects]);

  useEffect(() => {
    if (subjectId && !subjects.some((subject) => subject.id === subjectId)) {
      setSubjectId("");
      setSubjectReady(true);
    }
  }, [subjectId, subjects]);

  const visibleRows = grades.filter((row) => (row.subjectId ?? "") === subjectId);
  const totalWeight = visibleRows.reduce((sum, row) => sum + row.weight, 0);
  const weightedSum = visibleRows.reduce((sum, row) => sum + row.grade * row.weight, 0);
  const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const progress = Math.min(100, (average / 5) * 100);
  const selectedSubject = subjects.find((subject) => subject.id === subjectId);

  const message =
    visibleRows.length === 0
      ? "Agrega una actividad para empezar a calcular."
      : average >= 4
        ? "Excelente, vas por muy buen camino."
        : average >= 3
          ? "Vas bien, aún hay margen para subir."
          : "Necesitas reforzar antes del próximo corte.";

  function markDirty(id: string) {
    setDirtyIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  function updateRow(id: string, patch: Partial<GradeItem>) {
    setGrades((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    markDirty(id);
  }

  async function addRow() {
    setError("");
    setAdding(true);
    try {
      const remaining = Math.max(0, 100 - totalWeight);
      const { grade } = await api.grades.create({
        name: `Actividad ${visibleRows.length + 1}`,
        grade: 0,
        weight: remaining,
        subjectId: subjectId || null,
      });
      setGrades((current) => [...current, grade]);
    } catch (addError) {
      setError(messageFor(addError, "No pudimos agregar la actividad."));
    } finally {
      setAdding(false);
    }
  }

  async function saveRow(row: GradeItem) {
    if (!dirtyIds.has(row.id)) return;

    setError("");
    setSavingId(row.id);
    try {
      const { grade } = await api.grades.update(row.id, {
        name: row.name.trim() || "Actividad sin nombre",
        grade: row.grade,
        weight: row.weight,
      });
      setGrades((current) => current.map((item) => (item.id === grade.id ? grade : item)));
      setDirtyIds((current) => {
        const next = new Set(current);
        next.delete(grade.id);
        return next;
      });
    } catch (saveError) {
      setError(messageFor(saveError, "No pudimos guardar los cambios."));
    } finally {
      setSavingId(null);
    }
  }

  async function removeRow(row: GradeItem) {
    if (!window.confirm(`¿Eliminar "${row.name}"?`)) return;

    setError("");
    setSavingId(row.id);
    try {
      await api.grades.deleteGrade(row.id);
      setGrades((current) => current.filter((item) => item.id !== row.id));
      setDirtyIds((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    } catch (deleteError) {
      setError(messageFor(deleteError, "No pudimos eliminar la actividad."));
    } finally {
      setSavingId(null);
    }
  }

  function handleEnter(event: React.KeyboardEvent<HTMLInputElement>, row: GradeItem) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void saveRow(row);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Promediador</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Calcula tu nota final con los pesos de cada actividad. Tus notas se guardan en tu cuenta.
          </p>
        </div>
        <div>
          <label htmlFor="averager-subject" className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            Materia
          </label>
          <select
            id="averager-subject"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setSubjectReady(true);
            }}
            className="h-10 min-w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-violet-400/50"
          >
            <option value="">Sin materia</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadGrades()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-2.5 py-1.5 font-medium transition hover:bg-rose-500/10"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      )}

      {status === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-72 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
          <div className="h-72 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Actividades{selectedSubject ? ` de ${selectedSubject.name}` : ""}
                </h3>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  Notas sobre 5.0 y pesos en porcentaje. Guarda cada fila después de editarla.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void addRow()}
                disabled={adding}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:border-violet-400/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} /> {adding ? "Agregando..." : "Agregar"}
              </button>
            </div>

            <div className="hidden grid-cols-[1fr_90px_90px_72px] gap-3 px-1 pb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] sm:grid">
              <span>Actividad</span>
              <span>Nota</span>
              <span>Peso</span>
              <span className="sr-only">Acciones</span>
            </div>

            <div className="space-y-2">
              {visibleRows.map((row) => {
                const dirty = dirtyIds.has(row.id);
                const saving = savingId === row.id;
                return (
                  <div
                    key={row.id}
                    className={`grid grid-cols-2 items-center gap-2 rounded-xl border bg-black/10 p-2 sm:grid-cols-[1fr_90px_90px_72px] sm:gap-3 ${
                      dirty ? "border-violet-400/30" : "border-[var(--border)]"
                    }`}
                  >
                    <input
                      type="text"
                      value={row.name}
                      onChange={(event) => updateRow(row.id, { name: event.target.value })}
                      onKeyDown={(event) => handleEnter(event, row)}
                      aria-label="Nombre de la actividad"
                      className="col-span-2 h-9 min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-xs text-[var(--foreground)] outline-none transition hover:border-[var(--border)] focus:border-violet-400/50 sm:col-span-1"
                    />
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={row.grade}
                      onChange={(event) =>
                        updateRow(row.id, {
                          grade: clamp(Number(event.target.value) || 0, 0, 5),
                        })
                      }
                      onKeyDown={(event) => handleEnter(event, row)}
                      aria-label={`Nota de ${row.name}`}
                      className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-violet-400/50"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={row.weight}
                        onChange={(event) =>
                          updateRow(row.id, {
                            weight: clamp(Number(event.target.value) || 0, 0, 100),
                          })
                        }
                        onKeyDown={(event) => handleEnter(event, row)}
                        aria-label={`Peso de ${row.name}`}
                        className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-violet-400/50"
                      />
                      <span className="text-[10px] text-[var(--muted)]">%</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1 sm:col-span-1 sm:justify-center">
                      <button
                        type="button"
                        onClick={() => void saveRow(row)}
                        disabled={!dirty || saving}
                        aria-label={`Guardar ${row.name}`}
                        title={dirty ? "Guardar cambios" : "Sin cambios"}
                        className={`grid size-9 place-items-center rounded-lg transition ${
                          dirty
                            ? "text-emerald-300 hover:bg-emerald-500/10"
                            : "text-[var(--muted)] opacity-40"
                        } disabled:cursor-not-allowed`}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeRow(row)}
                        disabled={saving}
                        aria-label={`Eliminar ${row.name}`}
                        className="grid size-9 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleRows.length === 0 && (
              <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-xs text-[var(--muted)]">
                {selectedSubject
                  ? `Aún no hay actividades para ${selectedSubject.name}.`
                  : "Agrega una actividad para empezar a calcular."}
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
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">{message}</p>

              <dl className="mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-[11px]">
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--muted)]">Actividades</dt>
                  <dd>{visibleRows.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--muted)]">Peso acumulado</dt>
                  <dd className={totalWeight === 100 ? "text-emerald-300" : "text-amber-300"}>
                    {totalWeight}%
                  </dd>
                </div>
                {dirtyIds.size > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-[var(--muted)]">Cambios sin guardar</dt>
                    <dd className="text-amber-300">{dirtyIds.size}</dd>
                  </div>
                )}
              </dl>

              {totalWeight !== 100 && (
                <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-[10px] leading-4 text-amber-200">
                  Los pesos suman {totalWeight}%. Ajusta las actividades para completar el 100% del curso.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
