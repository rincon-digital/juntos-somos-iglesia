"use client";

import { useState, useEffect } from "react";
import { GraduationCap, ArrowUpRight, X } from "lucide-react";
import { getCourses } from "@/actions/course/courses";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Toaster } from "sonner";
import StudentRegisterForm from "./StudentRegisterForm"; // Importamos el form

export default function Cursos({
  limit,
  onModalChange,
}: {
  limit?: number;
  onModalChange?: (open: boolean) => void;
}) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState<any | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchPublicCourses = async () => {
      // Pedimos uno más del límite para saber si hay más
      const fetchLimit = limit ? limit + 1 : undefined;
      const data = await getCourses(fetchLimit);
      
      if (limit && data.length > limit) {
        setCourses(data.slice(0, limit));
        setHasMore(true);
      } else {
        setCourses(data);
        setHasMore(false);
      }
      setIsLoading(false);
    };
    fetchPublicCourses();
  }, [limit]);

  useEffect(() => {
    const isModalOpen = !!selectedCurso || showRegister;
    if (onModalChange) onModalChange(isModalOpen);

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedCurso, showRegister, onModalChange]);

  return (
    <section id="cursos" className="py-24 bg-transparent text-white px-6">
      <Toaster position="bottom-right" richColors theme="dark" style={{ zIndex: 9999 }} />
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8]">
            PROGRAMAS DE <span className="text-[#FF6B00]">FORMACIÓN</span>
          </h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((curso, i) => {
            const registered = curso._count?.courseRegistration || 0;
            const quota = curso.quotaLimit || 0;
            const deadline = new Date(curso.deadline).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <motion.div
                key={curso.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setSelectedCurso(curso);
                  setShowRegister(true);
                }}
                className="group relative bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] hover:border-[#FF6B00]/40 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
              >
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-[#FF6B00]/10 transition-all" />

                <div className="p-8 md:p-10 flex-1">
                  <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
                    {/* LADO IZQUIERDO: INFO PRINCIPAL */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center group-hover:bg-[#FF6B00] transition-colors duration-500">
                          <GraduationCap
                            size={18}
                            className="text-[#FF6B00] group-hover:text-white transition-colors"
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00]/60">
                          Programa Activo
                        </span>
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-black uppercase italic leading-none text-white group-hover:text-[#FF6B00] transition-colors">
                        {curso.name}
                      </h3>
                      
                      <p className="text-white/40 text-sm leading-relaxed line-clamp-2 pr-4">
                        {curso.description}
                      </p>
                    </div>

                    {/* LADO DERECHO: DISPONIBILIDAD */}
                    <div className="flex flex-row md:flex-col justify-between md:justify-center gap-6 md:gap-4 md:pl-8 md:border-l border-white/5 w-full md:w-48 shrink-0">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                          Cierre de Inscripción
                        </p>
                        <p className="text-sm font-bold text-white uppercase italic">
                          {deadline}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                          Cupos (Inscritos/Total)
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#FF6B00]">
                            {registered}
                          </span>
                          <span className="text-sm font-bold text-white/20">/</span>
                          <span className="text-lg font-black text-white/60">
                            {quota}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÓN INFERIOR */}
                <div className="px-8 pb-8 md:px-10 md:pb-10">
                  <div className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 group-hover:bg-[#FF6B00] group-hover:border-[#FF6B00] transition-all duration-500">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white group-hover:text-black">
                      Inscribirme Ahora
                    </span>
                    <ArrowUpRight size={16} className="text-[#FF6B00] group-hover:text-black" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Botón Ver Más condicional */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 flex justify-center md:justify-end"
          >
            <Link
              href="/cursos"
              className="group flex items-center gap-4 bg-white/[0.02] hover:bg-[#FF6B00] border border-white/5 hover:border-[#FF6B00] px-8 py-4 rounded-2xl transition-all duration-500"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                Explorar todos los cursos
              </span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                <ArrowUpRight size={16} className="text-white" />
              </div>
            </Link>
          </motion.div>
        )}
      </div>

      {/* --- ELIMINADO: MODAL INFO DEL CURSO --- */}

      {/* --- MODAL DE INSCRIPCIÓN (TU FORMULARIO) --- */}
      <AnimatePresence>
        {showRegister && selectedCurso && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowRegister(false);
                setSelectedCurso(null);
              }}
              className="absolute inset-0 bg-black/98 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-[1000px] bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[95vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black uppercase italic text-white">
                    Inscripción
                  </h3>
                  <p className="text-[10px] text-[#FF6B00] font-bold uppercase tracking-widest mt-1">
                    {selectedCurso.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setSelectedCurso(null);
                  }}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40"
                >
                  <X size={20} />
                </button>
              </div>

              {/* AQUÍ SE MONTA TU FORMULARIO CORREGIDO */}
              <StudentRegisterForm
                courseId={selectedCurso.id}
                onSuccess={() => {
                  setShowRegister(false);
                  setSelectedCurso(null);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
