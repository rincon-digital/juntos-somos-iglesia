import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// ─── STATUS DEL CURSO BLINDADO ──────────────────────────────────
type CourseStatus = "available" | "expired" | "full";

export function getCourseStatus(course: any): CourseStatus {
  // Si por alguna razón llega un curso vacío, no rompemos la app
  if (!course) return "available";

  const now = new Date();
  // Evitamos Invalid Date si no hay deadline
  const deadline = course.deadline
    ? new Date(course.deadline)
    : new Date(8640000000000000);
  const enrolled = course._count?.courseRegistration ?? 0;

  if (deadline < now) return "expired";
  // Evitamos falsos positivos si no hay limite de cupo
  if (enrolled >= (course.quotaLimit || Infinity)) return "full";

  return "available";
}

// ─── GRÁFICO 1: ESTADO DE CURSOS ────────────────────────────
export function CourseStatusChart({ courses }: { courses: any[] }) {
  // Protección por si courses no llega como array
  const safeCourses = Array.isArray(courses) ? courses : [];

  const available = safeCourses.filter(
    (c) => getCourseStatus(c) === "available",
  );
  const full = safeCourses.filter((c) => getCourseStatus(c) === "full");
  const expired = safeCourses.filter((c) => getCourseStatus(c) === "expired");
  const total = safeCourses.length || 1; // Evita división por cero

  const bars = [
    {
      label: "Disponibles",
      count: available.length,
      color: "#FF6B00",
      icon: CheckCircle,
    },
    {
      label: "Llenos",
      count: full.length,
      color: "#f59e0b",
      icon: AlertCircle,
    },
    {
      label: "Vencidos",
      count: expired.length,
      color: "#374151",
      icon: XCircle,
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-4">
        {bars.map(({ label, count, color, icon: Icon }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Icon size={11} style={{ color }} />
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                  {label}
                </span>
              </div>
              <span className="text-xs font-black" style={{ color }}>
                {count}
              </span>
            </div>
            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / total) * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">
          Activos ahora
        </p>
        {available.length === 0 && (
          <p className="text-[10px] text-white/20 italic">
            Sin cursos disponibles
          </p>
        )}
        {available.slice(0, 4).map((c) => (
          <div
            key={c.id || Math.random()}
            className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0"
          >
            <span className="text-[11px] text-white/60 truncate max-w-[70%]">
              {c?.name || "Sin Título"} {/* <-- Protección contra nulos */}
            </span>
            <span className="text-[10px] font-bold text-[#FF6B00]">
              {c?._count?.courseRegistration ?? 0}/{c?.quotaLimit || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
