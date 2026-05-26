"use client";
import React, { useEffect, useState } from "react";
import { getInfoCourses } from "@/actions/course/courses";
import { BarChart3, PieChart } from "lucide-react";
import CourseCommandCenter from "@/components/admin/Course/CourseCommandCenter";
import { CourseStatusChart } from "@/components/admin/Course/CourseStatusChart";
import { StudentsPerCourseChart } from "@/components/admin/Course/students/StudentsPerCourseChart";

export default function CoursePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Candado de seguridad

    const loadData = async () => {
      try {
        const res = await getInfoCourses();
        if (isMounted && Array.isArray(res)) {
          setCourses(res);
        }
      } catch (error) {
        console.error("Error cargando analíticas:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 space-y-12">
      {/* ── SECCIÓN DE ANALÍTICAS ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 2: Gráfico de Estados */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <PieChart size={16} className="text-[#FF6B00]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Estado de Cupos
            </h2>
          </div>
          <div className="h-[200px]">
            {loading ? (
              <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl" />
            ) : (
              // Si los gráficos están rompiendo la app, el problema es su código interno
              <CourseStatusChart courses={courses} />
            )}
          </div>
        </div>

        {/* Card 3: Gráfico de Inscritos */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 size={16} className="text-[#FF6B00]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Demanda por Curso
            </h2>
          </div>
          <div className="h-[200px]">
            {loading ? (
              <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl" />
            ) : (
              <StudentsPerCourseChart courses={courses} />
            )}
          </div>
        </div>
      </section>

      {/* ── CENTRO DE MANDO (LISTADO) ── */}
      <section>
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-white/20">
            Inventario de Programas
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <CourseCommandCenter />
      </section>
    </div>
  );
}
