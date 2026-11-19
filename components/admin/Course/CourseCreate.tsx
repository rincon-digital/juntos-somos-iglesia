"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, BookOpen, FileText, RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";
import { createCourse } from "@/actions/course/courses";

interface CourseCreateProps {
  onSuccess?: () => void;
}

const fieldClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#a8a29e] focus:ring-2 focus:ring-[#FF6B00]/30 ${
    hasError ? "border-red-600 focus:border-red-600" : "border-[#e7e5e4] hover:border-[#d6d3d1] focus:border-[#0a0a0a]"
  }`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-700">
      {message}
    </p>
  );
}

/* ---------- Fechas como días de calendario ("YYYY-MM-DD"), sin horas ni zonas ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (k: string, n: number) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
const longDate = (k: string) =>
  fromKey(k).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function CouponIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2.46433 9.34375C2.21579 9.34375 1.98899 9.14229 2.00041 8.87895C2.06733 7.33687 2.25481 6.33298 2.78008 5.53884C3.08228 5.08196 3.45765 4.68459 3.88923 4.36468C5.05575 3.5 6.70139 3.5 9.99266 3.5H14.0074C17.2986 3.5 18.9443 3.5 20.1108 4.36468C20.5424 4.68459 20.9177 5.08196 21.2199 5.53884C21.7452 6.33289 21.9327 7.33665 21.9996 8.87843C22.011 9.14208 21.7839 9.34375 21.5351 9.34375C20.1493 9.34375 19.0259 10.533 19.0259 12C19.0259 13.467 20.1493 14.6562 21.5351 14.6562C21.7839 14.6562 22.011 14.8579 21.9996 15.1216C21.9327 16.6634 21.7452 17.6671 21.2199 18.4612C20.9177 18.918 20.5424 19.3154 20.1108 19.6353C18.9443 20.5 17.2986 20.5 14.0074 20.5H9.99266C6.70139 20.5 5.05575 20.5 3.88923 19.6353C3.45765 19.3154 3.08228 18.918 2.78008 18.4612C2.25481 17.667 2.06733 16.6631 2.00041 15.1211C1.98899 14.8577 2.21579 14.6562 2.46433 14.6562C3.85012 14.6562 4.97352 13.467 4.97352 12C4.97352 10.533 3.85012 9.34375 2.46433 9.34375Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ---------- Calendario de rango: primer clic = apertura, segundo = cierre ---------- */

function RangeCalendar({
  start,
  end,
  onChange,
  hasError,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  hasError?: boolean;
}) {
  const today = toKey(new Date());
  const [view, setView] = useState(() => {
    const base = fromKey(start || today);
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState(start || today);
  const gridRef = useRef<HTMLDivElement>(null);

  // Semanas del mes visible, empezando en lunes
  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const startKey = addDays(toKey(first), -offset);
    const total = Math.ceil((offset + new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDays(startKey, i));
  }, [view]);

  const monthLabel = view.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const viewMonth = view.getMonth();
  const canGoBack = view > new Date(fromKey(today).getFullYear(), fromKey(today).getMonth(), 1);

  // Mientras elige el cierre, se pinta el rango hasta donde está el mouse
  const rangeEnd = end || (start && hovered && hovered > start ? hovered : "");

  const pick = (k: string) => {
    if (k < today) return;
    if (!start || end || k < start) onChange(k, "");
    else onChange(start, k);
  };

  const moveFocus = (k: string) => {
    setFocusKey(k);
    const d = fromKey(k);
    if (d.getMonth() !== viewMonth || d.getFullYear() !== view.getFullYear()) {
      setView(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${k}"]`)?.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step === undefined || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    moveFocus(addDays(focusKey, step));
  };

  const shiftMonth = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <div className={`pt-1 ${hasError ? "rounded-2xl ring-1 ring-red-600" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoBack}
          aria-label="Mes anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <p aria-live="polite" className="text-sm font-semibold first-letter:uppercase">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div role="grid" aria-label={`Elegí apertura y cierre, ${monthLabel}`} ref={gridRef} onKeyDown={onKeyDown}>
        <div role="row" className="grid grid-cols-7 pb-1">
          {WEEKDAYS.map((w, i) => (
            <span key={i} role="columnheader" className="text-center text-xs font-medium text-[#a8a29e]">
              {w}
            </span>
          ))}
        </div>
        {Array.from({ length: days.length / 7 }, (_, row) => (
          <div role="row" key={row} className="grid grid-cols-7 gap-y-1">
            {days.slice(row * 7, row * 7 + 7).map((k, col) => {
              const outside = fromKey(k).getMonth() !== viewMonth;
              const past = k < today;
              const isStart = k === start;
              const isEnd = k === rangeEnd;
              const inRange = !!start && !!rangeEnd && k > start && k < rangeEnd;
              const edge = isStart || isEnd;
              // La franja une los días: se redondea en los extremos y en los bordes de la semana
              const band =
                (inRange || (isStart && rangeEnd && rangeEnd !== start) || (isEnd && start && rangeEnd !== start)) &&
                !outside;
              const bandShape = `${isStart || col === 0 ? "rounded-l-full" : ""} ${isEnd || col === 6 ? "rounded-r-full" : ""}`;

              return (
                <div role="gridcell" key={k} aria-selected={edge || inRange} className="relative flex h-11 items-center justify-center">
                  {band && <span aria-hidden="true" className={`absolute inset-y-0.5 inset-x-0 bg-[#fff1e6] ${bandShape}`} />}
                  <button
                    type="button"
                    data-day={k}
                    tabIndex={k === focusKey ? 0 : -1}
                    disabled={past}
                    onClick={() => pick(k)}
                    onMouseEnter={() => setHovered(k)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setFocusKey(k)}
                    aria-label={`${longDate(k)}${isStart ? ", apertura" : ""}${isEnd ? ", cierre" : ""}`}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
                      edge
                        ? "bg-[#FF6B00] font-semibold text-white shadow-[0_6px_16px_rgba(255,107,0,0.35)]"
                        : inRange
                          ? "font-medium text-[#C2410C] hover:bg-[#ffe4cc]"
                          : past
                            ? "text-[#d6d3d1]"
                            : outside
                              ? "text-[#a8a29e] hover:bg-[#f5f5f4]"
                              : "text-[#0a0a0a] hover:bg-[#f5f5f4]"
                    } ${k === today && !edge ? "ring-1 ring-inset ring-[#d6d3d1]" : ""}`}
                  >
                    {fromKey(k).getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-[#57534e]">
        {!start ? "Tocá el día en que abre la inscripción" : !end ? "Ahora tocá el día de cierre" : "Tocá otro día para empezar de nuevo"}
      </p>
    </div>
  );
}

/* ---------- Formulario ---------- */

export default function CourseCreate({ onSuccess }: CourseCreateProps) {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quotaLimit: 0,
    openEnrollment: "",
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.openEnrollment || !formData.deadline) {
      setFieldErrors({ deadline: "Elegí en el calendario el día de apertura y el de cierre." });
      return;
    }
    setLoading(true);
    setFieldErrors({});
    const toastId = toast.loading("Creando curso...");

    try {
      const res = await createCourse({
        name: formData.name,
        description: formData.description,
        quotaLimit: Number(formData.quotaLimit),
        openEnrollment: formData.openEnrollment as any,
        deadline: formData.deadline as any,
        accessCode: "",
      });

      if (res && res.success) {
        toast.success("Curso creado", { id: toastId });
        setFormData({ name: "", description: "", quotaLimit: 0, openEnrollment: "", deadline: "" });
        if (onSuccess) onSuccess();
      } else if (res?.error && typeof res.error === "object") {
        setFieldErrors(res.error);
        toast.error("Revisá los datos del formulario", { id: toastId });
      } else {
        toast.error((res?.error as string) || "Error al crear el curso", { id: toastId });
      }
    } catch (error) {
      toast.error("Error inesperado en el servidor", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const dateError = fieldErrors.openEnrollment || fieldErrors.deadline;

  return (
    <section
      aria-labelledby="titulo-crear-curso"
      className="pt-1 text-[#0a0a0a] font-[family-name:var(--font-poppins)]"
    >
      <h2 id="titulo-crear-curso" className="text-xl font-semibold tracking-[-0.02em]">
        Nuevo curso
      </h2>
      <p className="mt-1 text-sm text-[#57534e]">El código de acceso se genera solo al crearlo.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="curso-nombre" className="text-sm font-medium text-[#292524]">Nombre</label>
          <div className="relative">
            <BookOpen size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]" />
            <input
              id="curso-nombre"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Liderazgo avanzado"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "error-nombre" : undefined}
              className={`${fieldClass(!!fieldErrors.name)} h-12`}
            />
          </div>
          <FieldError id="error-nombre" message={fieldErrors.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="curso-descripcion" className="text-sm font-medium text-[#292524]">Descripción</label>
          <div className="relative">
            <FileText size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 text-[#57534e]" />
            <textarea
              id="curso-descripcion"
              required
              rows={2}
              maxLength={5000}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="De qué se trata el curso…"
              aria-invalid={!!fieldErrors.description}
              aria-describedby={fieldErrors.description ? "error-descripcion" : undefined}
              className={`${fieldClass(!!fieldErrors.description)} resize-none py-3`}
            />
          </div>
          <FieldError id="error-descripcion" message={fieldErrors.description} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="curso-cupos" className="text-sm font-medium text-[#292524]">Cupos</label>
          <div className="relative">
            <CouponIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]" />
            <input
              id="curso-cupos"
              required
              type="number"
              inputMode="numeric"
              min="2"
              value={formData.quotaLimit || ""}
              onChange={(e) => setFormData({ ...formData, quotaLimit: parseInt(e.target.value) || 0 })}
              placeholder="Cuántas personas pueden inscribirse"
              aria-invalid={!!fieldErrors.quotaLimit}
              aria-describedby={fieldErrors.quotaLimit ? "error-cupos" : undefined}
              className={`${fieldClass(!!fieldErrors.quotaLimit)} h-12`}
            />
          </div>
          <FieldError id="error-cupos" message={fieldErrors.quotaLimit} />
        </div>

        {/* Inscripción: resumen + calendario */}
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Inscripción</legend>
          <div className="flex items-center justify-between">
            <span aria-hidden="true" className="text-sm font-medium text-[#292524]">Inscripción</span>
            {(formData.openEnrollment || formData.deadline) && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, openEnrollment: "", deadline: "" })}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <RotateCcw size={13} aria-hidden="true" /> Limpiar fechas
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Abre", value: formData.openEnrollment },
              { label: "Cierra", value: formData.deadline },
            ].map((f) => (
              <div key={f.label} className={`rounded-xl px-3 py-2 ${f.value ? "bg-[#fff7ed]" : "bg-[#fafaf9]"}`}>
                <p className="text-xs text-[#57534e]">{f.label}</p>
                <p className={`text-sm font-semibold first-letter:uppercase ${f.value ? "text-[#C2410C]" : "text-[#a8a29e]"}`}>
                  {f.value ? longDate(f.value) : "Sin elegir"}
                </p>
              </div>
            ))}
          </div>
          <RangeCalendar
            start={formData.openEnrollment}
            end={formData.deadline}
            hasError={!!dateError}
            onChange={(openEnrollment, deadline) => {
              setFormData({ ...formData, openEnrollment, deadline });
              if (dateError) setFieldErrors({ ...fieldErrors, openEnrollment: undefined, deadline: undefined });
            }}
          />
          <FieldError id="error-fechas" message={dateError} />
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Creando…
            </>
          ) : (
            "Crear curso"
          )}
        </button>
      </form>
    </section>
  );
}
