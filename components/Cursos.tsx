"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X } from "lucide-react";
import { getCourses } from "@/actions/course/courses";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Toaster } from "@/lib/toast";
import StudentRegisterForm from "./StudentRegisterForm"; // Importamos el form

// Íconos de Hugeicons (core-free-icons, licencia MIT), copiados para no sumar dependencias
function CouponIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.46433 9.34375C2.21579 9.34375 1.98899 9.14229 2.00041 8.87895C2.06733 7.33687 2.25481 6.33298 2.78008 5.53884C3.08228 5.08196 3.45765 4.68459 3.88923 4.36468C5.05575 3.5 6.70139 3.5 9.99266 3.5H14.0074C17.2986 3.5 18.9443 3.5 20.1108 4.36468C20.5424 4.68459 20.9177 5.08196 21.2199 5.53884C21.7452 6.33289 21.9327 7.33665 21.9996 8.87843C22.011 9.14208 21.7839 9.34375 21.5351 9.34375C20.1493 9.34375 19.0259 10.533 19.0259 12C19.0259 13.467 20.1493 14.6562 21.5351 14.6562C21.7839 14.6562 22.011 14.8579 21.9996 15.1216C21.9327 16.6634 21.7452 17.6671 21.2199 18.4612C20.9177 18.918 20.5424 19.3154 20.1108 19.6353C18.9443 20.5 17.2986 20.5 14.0074 20.5H9.99266C6.70139 20.5 5.05575 20.5 3.88923 19.6353C3.45765 19.3154 3.08228 18.918 2.78008 18.4612C2.25481 17.667 2.06733 16.6631 2.00041 15.1211C1.98899 14.8577 2.21579 14.6562 2.46433 14.6562C3.85012 14.6562 4.97352 13.467 4.97352 12C4.97352 10.533 3.85012 9.34375 2.46433 9.34375Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 2V6M8 2V6" />
        <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" />
        <path d="M3 10H21" />
      </g>
    </svg>
  );
}

// Los nombres vienen en mayúsculas desde el admin: los mostramos en tipo oración
const toSentenceCase = (text: string) =>
  text === text.toUpperCase()
    ? text.charAt(0) + text.slice(1).toLowerCase()
    : text;

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const closeRegister = () => {
    setShowRegister(false);
    setSelectedCurso(null);
  };

  useEffect(() => {
    if (!showRegister) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRegister();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showRegister]);

  return (
    <section
      id="cursos"
      className="px-6 py-24 text-[#0a0a0a] font-[family-name:var(--font-poppins)]"
    >
      <Toaster position="bottom-right" richColors theme="light" style={{ zIndex: 9999 }} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-xl">
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            Cursos abiertos
          </h2>
          <p className="mt-3 text-base text-[#57534e]">
            Inscribite antes del cierre. Los cupos son limitados.
          </p>
        </header>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,360px))] justify-center gap-6 md:justify-start">
          {courses.map((curso, i) => {
            const registered = curso._count?.courseRegistration || 0;
            const quota = curso.quotaLimit || 0;
            const deadlineDate = new Date(curso.deadline);
            const deadline = deadlineDate.toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            });
            const isFull = quota > 0 && registered >= quota;
            const isClosed = deadlineDate.getTime() < Date.now();
            const label = isFull
              ? "Sin cupos"
              : isClosed
                ? "Inscripción cerrada"
                : "Inscribirme";

            return (
              <motion.article
                key={curso.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col rounded-[2rem] border border-[#e7e5e4] bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
              >
                <div className="flex flex-1 flex-col px-4 pb-2 pt-5">
                  <h3 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-[-0.02em]">
                    {toSentenceCase(curso.name)}
                  </h3>
                  {curso.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-[#57534e]">
                      {curso.description}
                    </p>
                  )}

                  <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#57534e]">
                    <li className="flex items-center gap-1.5">
                      <CouponIcon />
                      <span>
                        Cupos{" "}
                        <strong className="font-semibold tabular-nums text-[#0a0a0a]">
                          {registered}/{quota}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CalendarIcon />
                      <span>
                        Cierra{" "}
                        <strong className="font-semibold text-[#0a0a0a]">{deadline}</strong>
                      </span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    disabled={isFull || isClosed}
                    onClick={() => {
                      setSelectedCurso(curso);
                      setShowRegister(true);
                    }}
                    className="mt-6 h-12 w-full rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] duration-200 ease-out hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#e7e5e4] disabled:text-[#57534e] disabled:active:scale-100"
                  >
                    {label}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Botón Ver Más condicional */}
        {hasMore && (
          <div className="mt-12 flex justify-center md:justify-start">
            <Link
              href="/cursos"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#e7e5e4] px-6 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
            >
              Ver todos los cursos
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {/* --- ELIMINADO: MODAL INFO DEL CURSO --- */}

      {/* --- MODAL DE INSCRIPCIÓN (TU FORMULARIO) --- */}
      {/* El portal va afuera: AnimatePresence descarta los portales como hijos directos */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showRegister && selectedCurso && (
            <div
              key="modal-inscripcion"
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-[family-name:var(--font-poppins)]"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeRegister}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-inscripcion"
                initial={{ y: 16, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 8, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[2rem] bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:p-8"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3
                      id="titulo-inscripcion"
                      className="text-2xl font-semibold tracking-[-0.02em] text-[#0a0a0a]"
                    >
                      Inscripción
                    </h3>
                    <p className="mt-1 text-sm text-[#57534e]">
                      {toSentenceCase(selectedCurso.name)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeRegister}
                    aria-label="Cerrar"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e] transition-colors hover:bg-[#e7e5e4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <StudentRegisterForm
                  courseId={selectedCurso.id}
                  onSuccess={closeRegister}
                />
              </motion.div>
            </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
