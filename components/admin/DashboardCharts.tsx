"use client";
// Gráficos del panel en SVG, animados con framer-motion (sin librerías de gráficos extra)
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

// Número que cuenta desde 0 hasta el valor
export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString("es-AR")}
      {suffix}
    </span>
  );
}

function toPoints(values: number[], width: number, height: number, pad = 4) {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  return values.map((v, i) => [pad + i * step, height - pad - (v / max) * (height - pad * 2)] as const);
}

// Curva suave por puntos (catmull-rom simplificado)
function smoothPath(points: readonly (readonly [number, number])[]) {
  if (points.length === 0) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] ?? points[i];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[i + 2] ?? points[i + 1];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
  }
  return d;
}

// Une los puntos con tramos rectos: con pocos datos una curva suave inventa valores negativos
function linePath(points: readonly (readonly [number, number])[]) {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

// Mini línea de tendencia para las tarjetas
export function Sparkline({
  values,
  color = "#FF6B00",
  className = "h-9 w-[120px]",
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const w = 120;
  const h = 36;
  const d = linePath(toPoints(values, w, h));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
      />
    </svg>
  );
}

type Serie = { key: string; label: string; color: string };

// Gráfico de área con dos series y tooltip al pasar el mouse
export function AreaChart({
  data,
  series,
  fill = false,
}: {
  data: { label: string; [k: string]: number | string }[];
  series: Serie[];
  // true: ocupa todo el alto del contenedor en lugar de una altura fija
  fill?: boolean;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const w = 640;
  const h = 220;
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const y = (v: number) => h - 8 - (v / max) * (h - 24);

  return (
    <div className={`relative ${fill ? "flex h-full flex-col" : ""}`}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className={`w-full overflow-visible ${fill ? "min-h-0 flex-1" : "h-56"}`}
        role="img"
        aria-label="Evolución mensual"
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`area-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={0} x2={w} y1={y(max * t)} y2={y(max * t)} stroke="#e7e5e4" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
        ))}

        {series.map((s, si) => {
          const pts = data.map((d, i) => [i * step, y(Number(d[s.key]) || 0)] as const);
          const line = smoothPath(pts);
          return (
            <g key={s.key}>
              <motion.path
                d={`${line} L ${w} ${h} L 0 ${h} Z`}
                fill={`url(#area-${s.key})`}
                initial={{ opacity: reduce ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 + si * 0.15 }}
              />
              <motion.path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: EASE, delay: si * 0.15 }}
              />
            </g>
          );
        })}

        {hover !== null && (
          <line x1={hover * step} x2={hover * step} y1={0} y2={h} stroke="#0a0a0a" strokeOpacity={0.15} vectorEffect="non-scaling-stroke" />
        )}

        {/* Zonas invisibles para el tooltip */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={i * step - step / 2}
            y={0}
            width={step}
            height={h}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-2xl bg-[#0a0a0a] px-3 py-2 text-xs text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          style={{ left: `${(hover / Math.max(data.length - 1, 1)) * 100}%` }}
        >
          <p className="mb-1 font-medium capitalize">{data[hover].label}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2 tabular-nums">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}: {Number(data[hover][s.key]) || 0}
            </p>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-between text-xs capitalize text-[#57534e]">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// Barras agrupadas por mes, que crecen desde abajo al cargar
export function BarChart({
  data,
  series,
}: {
  data: { label: string; [k: string]: number | string }[];
  series: Serie[];
}) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        {/* Líneas guía */}
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="border-t border-dashed border-[#e7e5e4]" />
          ))}
        </div>
        <div className="relative flex h-full items-end justify-around gap-2">
          {data.map((d, di) => (
            <div key={d.label} className="flex h-full items-end gap-1.5" role="group" aria-label={`${d.label}: ${series.map((s) => `${s.label} ${Number(d[s.key]) || 0}`).join(", ")}`}>
              {series.map((s, si) => {
                const v = Number(d[s.key]) || 0;
                const pct = (v / max) * 100;
                return (
                  <div key={s.key} className="relative flex h-full w-4 items-end lg:w-5">
                    {v > 0 && (
                      <span className="absolute inset-x-0 text-center text-xs font-medium tabular-nums" style={{ bottom: `calc(${pct}% + 4px)` }}>
                        {v}
                      </span>
                    )}
                    <motion.div
                      className="w-full rounded-t-md"
                      style={{ background: s.color, height: v > 0 ? `${pct}%` : 3, opacity: v > 0 ? 1 : 0.15, transformOrigin: "bottom" }}
                      initial={{ scaleY: reduce ? 1 : 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.2 + di * 0.06 + si * 0.04 }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-around text-xs capitalize text-[#57534e]">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// Anillo de porcentaje
export function Ring({ percent, size = 132 }: { percent: number; size?: number }) {
  const reduce = useReducedMotion();
  const r = 52;
  const c = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={60} cy={60} r={r} fill="none" stroke="#f5f5f4" strokeWidth={12} />
        <motion.circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke="#FF6B00"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c - (safe / 100) * c : c }}
          animate={{ strokeDashoffset: c - (safe / 100) * c }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-[-0.03em]">
          <AnimatedNumber value={safe} suffix="%" />
        </span>
        <span className="text-xs text-[#57534e]">ocupado</span>
      </div>
    </div>
  );
}

// Barra de progreso animada
export function ProgressBar({ percent }: { percent: number }) {
  const reduce = useReducedMotion();
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f5f4]">
      <motion.div
        className={`h-full rounded-full ${safe >= 90 ? "bg-red-600" : "bg-[#FF6B00]"}`}
        initial={{ width: reduce ? `${safe}%` : 0 }}
        animate={{ width: `${safe}%` }}
        transition={{ duration: 1, ease: EASE, delay: 0.3 }}
      />
    </div>
  );
}
