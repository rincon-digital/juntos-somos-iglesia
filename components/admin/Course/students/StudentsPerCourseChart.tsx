import { getCourseStatus } from "../CourseStatusChart";
import { motion } from "framer-motion";

// ─── GRÁFICO 2: ALUMNOS POR CURSO ───────────────────────────
export function StudentsPerCourseChart({ courses }: { courses: any[] }) {
  // Protección estricta: si es undefined o no hay items, cortamos el render seguro
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[10px] text-white/20 uppercase tracking-widest">
          Sin datos
        </p>
      </div>
    );
  }

  const sorted = [...courses]
    .sort(
      (a, b) =>
        (b?._count?.courseRegistration ?? 0) -
        (a?._count?.courseRegistration ?? 0),
    )
    .slice(0, 6);

  const max = Math.max(
    ...sorted.map((c) => c?._count?.courseRegistration ?? 0),
    1,
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-end gap-3 flex-1 pb-6 relative">
        {/* Y-axis guides */}
        <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none">
          {[1, 0.5, 0].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] text-white/15 w-4 text-right">
                {i === 0 ? max : i === 1 ? Math.round(max / 2) : 0}
              </span>
              <div className="flex-1 border-t border-white/[0.04]" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="flex items-end gap-2.5 flex-1 ml-7 h-full">
          {sorted.map((c, i) => {
            const count = c?._count?.courseRegistration ?? 0;
            const pct = (count / max) * 100;
            const status = getCourseStatus(c);
            const barColor =
              status === "available"
                ? "#FF6B00"
                : status === "full"
                  ? "#f59e0b"
                  : "#374151";

            return (
              <div
                key={c.id || `bar-${i}`}
                className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
              >
                <span
                  className="text-[10px] font-black"
                  style={{ color: barColor }}
                >
                  {count}
                </span>
                <div
                  className="w-full flex flex-col justify-end"
                  style={{ height: "100%" }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    // Evitamos que valores NaN rompan framer motion
                    animate={{ height: `${Math.max(Number(pct) || 0, 4)}%` }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.07,
                      ease: "easeOut",
                    }}
                    className="w-full rounded-t-md"
                    style={{ background: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-2.5 ml-7">
        {sorted.map((c, i) => (
          <div key={c.id || `label-${i}`} className="flex-1 text-center">
            <span className="text-[8px] font-semibold text-white/25 uppercase tracking-wide leading-tight line-clamp-2">
              {/* 🔥 ESTO ROMPÍA LA APP SI EL CURSO NO TENÍA NOMBRE */}
              {(c?.name || "Curso").split(" ").slice(0, 2).join(" ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
