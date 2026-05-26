"use client";
import React, { useEffect, useState } from "react";
import { getInfoCourses } from "@/actions/course/courses";
import {
  Users,
  Target,
  TrendingUp,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CourseCommandCenter from "@/components/admin/Course/CourseCommandCenter";

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVars = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function CoursePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const res = await getInfoCourses(true); // true para traer todos si es superadmin
      if (Array.isArray(res)) setCourses(res);
      setLoading(false);
    };
    loadData();
  }, []);

  // --- CÁLCULOS DE DATOS REALES ---
  const totalStudents = courses.reduce(
    (acc, c) => acc + (c._count?.courseRegistration || 0),
    0,
  );
  const totalQuota = courses.reduce((acc, c) => acc + (c.quotaLimit || 0), 0);
  const averageOccupation =
    totalQuota > 0 ? Math.round((totalStudents / totalQuota) * 100) : 0;
  const activeCourses = courses.length;

  // Identificar cursos críticos (casi llenos)
  const criticalCourses = courses.filter((c) => {
    const occupation = (c._count?.courseRegistration / c.quotaLimit) * 100;
    return occupation >= 80;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.5em]">
            Sincronizando Base de Datos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="min-h-screen bg-[#050505] text-white p-6 md:p-12 space-y-16"
    >
      {/* ── HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
        <motion.div variants={itemVars}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full text-[9px] font-mono font-black text-[#FF6B00] uppercase tracking-widest">
              Live Dashboard
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
            Control de <span className="text-[#FF6B00]">Cursos</span>
          </h1>
        </motion.div>

        <motion.div variants={itemVars} className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              Estado del Servidor
            </p>
            <p className="text-xs font-bold text-green-500 flex items-center justify-end gap-2 uppercase">
              Operativo <Activity size={12} />
            </p>
          </div>
          <div className="h-16 w-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-5 rounded-[2rem] backdrop-blur-md">
            <ShieldCheck className="text-[#FF6B00]" size={28} />
            <div>
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                Acceso Nivel
              </p>
              <p className="text-sm font-black uppercase italic">
                Master Admin
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      {/* ── MÉTRICAS DE ALTO IMPACTO (KPIs) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card: Ocupación Real */}
        <motion.div
          variants={itemVars}
          className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] relative group hover:border-[#FF6B00]/40 transition-colors"
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-6">
            Ocupación Total
          </p>
          <div className="flex items-end gap-4">
            <h3 className="text-6xl font-black tracking-tighter">
              {averageOccupation}%
            </h3>
            <div
              className={`mb-3 px-2 py-1 rounded text-[10px] font-bold uppercase ${averageOccupation > 80 ? "bg-red-500/20 text-red-500" : "bg-[#FF6B00]/20 text-[#FF6B00]"}`}
            >
              {averageOccupation > 80 ? "Crítico" : "Óptimo"}
            </div>
          </div>
          <div className="mt-8 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${averageOccupation}%` }}
              className={`h-full ${averageOccupation > 80 ? "bg-red-500" : "bg-[#FF6B00]"}`}
            />
          </div>
        </motion.div>

        {/* Card: Alumnos Inscritos */}
        <motion.div
          variants={itemVars}
          className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] group"
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-6">
            Alumnos Activos
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-6xl font-black tracking-tighter">
              {totalStudents}
            </h3>
            <Users
              size={40}
              className="text-white/10 group-hover:text-[#FF6B00]/20 transition-colors"
            />
          </div>
          <p className="mt-6 text-[9px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={12} className="text-green-500" /> Sincronizado en
            tiempo real
          </p>
        </motion.div>

        {/* Card: Cursos Críticos */}
        <motion.div
          variants={itemVars}
          className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] group relative overflow-hidden"
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-6">
            Cursos al Límite
          </p>
          <div className="flex items-center justify-between">
            <h3
              className={`text-6xl font-black tracking-tighter ${criticalCourses > 0 ? "text-red-500" : "text-white"}`}
            >
              {criticalCourses}
            </h3>
            <AlertCircle
              size={40}
              className={
                criticalCourses > 0
                  ? "text-red-500/20 animate-pulse"
                  : "text-white/10"
              }
            />
          </div>
          <p className="mt-6 text-[9px] font-bold text-white/20 uppercase tracking-widest">
            Requieren atención inmediata
          </p>
        </motion.div>

        {/* Card: Cupos Libres (Destacado) */}
        <motion.div
          variants={itemVars}
          className="bg-[#FF6B00] p-8 rounded-[2.5rem] group text-black shadow-[0_20px_50px_rgba(255,107,0,0.2)]"
        >
          <p className="text-[10px] font-mono text-black/60 uppercase tracking-[0.2em] mb-6">
            Cupos Disponibles
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-6xl font-black tracking-tighter">
              {totalQuota - totalStudents}
            </h3>
            <Target size={40} className="text-black/20" />
          </div>
          <p className="mt-6 text-[9px] font-bold text-black uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full w-fit">
            Potencial de Cierre
          </p>
        </motion.div>
      </section>

      {/* ── CENTRO DE MANDO (TABLA Y LISTADO) ── */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-black uppercase italic tracking-tighter">
              Inventario de <span className="text-[#FF6B00]">Programas</span>
            </h2>
            <div className="h-px w-32 bg-gradient-to-r from-[#FF6B00]/50 to-transparent hidden md:block" />
          </div>
        </div>

        {/* El Componente que ya tienes, pero integrado en un contenedor premium */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-2 md:p-6">
          <CourseCommandCenter />
        </div>
      </section>

      {/* ── FOOTER ANALÍTICO ── */}
      <footer className="pt-20 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12 pb-10">
        <div className="flex items-start gap-6">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF6B00] border border-white/10">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <h5 className="text-[11px] font-black uppercase tracking-widest mb-2">
              Proyección de Crecimiento
            </h5>
            <p className="text-[10px] text-white/30 leading-relaxed uppercase">
              La ocupación actual del {averageOccupation}% indica un rendimiento
              estable. <br />
              Se recomienda abrir nuevos cursos para los{" "}
              {totalQuota - totalStudents} cupos restantes.
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
