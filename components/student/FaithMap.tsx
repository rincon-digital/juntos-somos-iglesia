"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  CheckCircle2,
  Play,
  AlertTriangle,
  ChevronRight,
  Star,
  Trophy,
  Clock,
  ListChecks,
} from "lucide-react";
import VideoModal from "./VideoModal";
import confetti from "canvas-confetti";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FaithMap({ roadmap, onRefresh, courseName }: any) {
  const router = useRouter();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);

  const [localRoadmap, setLocalRoadmap] = useState<any[]>(roadmap || []);

  useEffect(() => {
    setLocalRoadmap(roadmap || []);
  }, [roadmap]);

  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
      if (onRefresh) onRefresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [onRefresh, router]);

  const isCourseFinished =
    localRoadmap.length > 0 && localRoadmap.every((l: any) => l.isCompleted);

  useEffect(() => {
    if (isCourseFinished && !hasFiredConfetti) {
      const confettiKey = `confetti_done_${courseName}`;
      const alreadyCelebrated = localStorage.getItem(confettiKey);

      if (!alreadyCelebrated) {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          confetti({
            particleCount: 40,
            spread: 80,
            origin: { y: 0.7 },
            colors: ["#FF6B00", "#ffffff", "#00FF00"],
            zIndex: 9999,
          });
        }, 300);

        localStorage.setItem(confettiKey, "true");
        setHasFiredConfetti(true);

        return () => clearInterval(interval);
      }
    }
  }, [isCourseFinished, courseName, hasFiredConfetti]);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white selection:bg-[#FF6B00] pb-32">
      <header className="max-w-6xl mx-auto pt-24 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <span className="h-[2px] w-12 bg-[#FF6B00]" />
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FF6B00]">
              Tu Ruta de Crecimiento
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase italic tracking-tighter leading-[0.85]">
            {courseName || "CURSO"}
            <span className="text-[#FF6B00]">.</span>
          </h1>
        </motion.div>
      </header>

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* LÍNEA DE PROGRESO ALINEADA A LA IZQUIERDA */}
        <div className="absolute left-10 md:left-16 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF6B00] via-white/5 to-transparent rounded-full opacity-50 shadow-[0_0_20px_#FF6B00]" />

        <div className="flex flex-col gap-12 relative z-10">
          {localRoadmap.map((lesson: any, index: number) => {
            // ✅ CAMBIO ACÁ: Agregamos lesson.isOptimisticallyStuck para que se bloquee al instante
            const isStuck =
              lesson.isOptimisticallyStuck ||
              lesson.videoReview?.some((rev: any) => {
                const hasPassed = rev.examAnswers?.some(
                  (ans: any) => ans.response === rev.correctOption,
                );
                return rev.examAnswers?.length >= 2 && !hasPassed;
              });

            const status = lesson.isCompleted
              ? "completed"
              : lesson.isLocked
                ? "locked"
                : isStuck
                  ? "stuck"
                  : "active";

            const progress =
              status === "completed" ? 100 : status === "stuck" ? 50 : 0;

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                className="relative flex items-center w-full"
              >
                <div
                  className={cn(
                    "absolute left-4 md:left-10 w-6 h-6 rounded-full border-[5px] border-[#050505] z-20 flex items-center justify-center transition-all duration-500",
                    status === "completed"
                      ? "bg-green-500 shadow-[0_0_20px_#22c55e] scale-110"
                      : status === "stuck"
                        ? "bg-red-500 shadow-[0_0_20px_#ef4444] scale-110"
                        : status === "active"
                          ? "bg-[#FF6B00] shadow-[0_0_20px_#FF6B00] animate-pulse scale-125"
                          : "bg-white/10",
                  )}
                />

                <div className="pl-16 md:pl-28 w-full">
                  <div
                    className={cn(
                      "group flex flex-col md:flex-row bg-gradient-to-br from-white/[0.04] to-[#050505] rounded-[2.5rem] border backdrop-blur-xl transition-all duration-500 overflow-hidden",
                      status === "active"
                        ? "border-[#FF6B00]/40 shadow-[0_20px_40px_-15px_rgba(255,107,0,0.2)] hover:-translate-y-1"
                        : status === "completed"
                          ? "border-green-500/20 shadow-[0_10px_30px_-15px_rgba(34,197,94,0.1)] hover:-translate-y-1"
                          : status === "stuck"
                            ? "border-red-500/40 bg-red-500/[0.02]"
                            : "border-white/5 opacity-50 grayscale hover:grayscale-0",
                    )}
                  >
                    <div className="hidden md:flex w-24 bg-white/[0.02] border-r border-white/5 items-center justify-center relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="-rotate-90 whitespace-nowrap text-3xl font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-[#FF6B00] transition-colors duration-500">
                        Clase 0{index + 1}
                      </span>
                    </div>

                    <div className="md:hidden bg-white/[0.02] border-b border-white/5 p-4 text-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00]">
                        Clase 0{index + 1}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row p-6 md:p-8 gap-8 relative">
                      <div className="relative w-full lg:w-72 aspect-video rounded-[1.5rem] overflow-hidden border border-white/10 flex-shrink-0 group-hover:border-[#FF6B00]/30 transition-all duration-500 shadow-xl">
                        <img
                          src={`https://img.youtube.com/vi/${lesson.videoId?.trim()}/hqdefault.jpg`}
                          className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700"
                          alt="Video Thumbnail"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {status === "completed" ? (
                            <div className="w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-md flex items-center justify-center">
                              <CheckCircle2
                                className="text-green-500"
                                size={24}
                              />
                            </div>
                          ) : status === "stuck" ? (
                            <div className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center">
                              <AlertTriangle
                                className="text-red-500"
                                size={24}
                              />
                            </div>
                          ) : status === "active" ? (
                            <button
                              onClick={() => setSelectedLesson(lesson)}
                              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-[#FF6B00] hover:text-white hover:scale-110 transition-all"
                            >
                              <Play
                                fill="currentColor"
                                size={24}
                                className="ml-1"
                              />
                            </button>
                          ) : (
                            <Lock size={24} className="text-white/30" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-[1.1] mb-4 text-white">
                            {lesson.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">
                            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                              <Clock size={12} className="text-[#FF6B00]" /> ~15
                              MIN
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                              <ListChecks
                                size={12}
                                className="text-[#FF6B00]"
                              />{" "}
                              {lesson.videoReview?.length || 0} Preguntas
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-auto">
                          <div className="flex-1 max-w-sm">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 text-white/50">
                              <span>Progreso del Módulo</span>
                              <span
                                className={
                                  status === "completed"
                                    ? "text-green-500"
                                    : status === "stuck"
                                      ? "text-red-500"
                                      : "text-[#FF6B00]"
                                }
                              >
                                {progress}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <div
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  status === "completed"
                                    ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
                                    : status === "stuck"
                                      ? "bg-red-500"
                                      : "bg-[#FF6B00]",
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {status === "active" && (
                              <button
                                onClick={() => setSelectedLesson(lesson)}
                                className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#FF6B00] hover:text-white transition-all flex items-center gap-2"
                              >
                                Comenzar <ChevronRight size={14} />
                              </button>
                            )}
                            {status === "stuck" && (
                              // ✅ CAMBIO ACÁ: Texto más profesional para el alumno
                              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold uppercase text-[9px] tracking-widest flex items-center gap-2">
                                <AlertTriangle size={12} /> En revisión por el
                                Pastor
                              </div>
                            )}
                            {status === "completed" && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-bold uppercase text-[9px] tracking-widest">
                                <Star size={12} className="fill-green-500" />{" "}
                                Etapa Superada
                              </div>
                            )}
                            {status === "locked" && (
                              <div className="px-4 py-2 bg-white/5 text-white/30 rounded-xl font-bold uppercase text-[9px] tracking-widest">
                                No Disponible
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mt-10 w-full relative z-20 pl-16 md:pl-28"
          >
            <div
              className={cn(
                "relative overflow-hidden p-10 md:p-14 rounded-[3rem] border backdrop-blur-xl text-center w-full transition-all duration-1000",
                isCourseFinished
                  ? "bg-gradient-to-br from-[#FF6B00]/20 to-black border-[#FF6B00]/50 shadow-[0_0_50px_rgba(255,107,0,0.3)]"
                  : "bg-white/[0.02] border-white/5 grayscale opacity-50",
              )}
            >
              <div className="flex justify-center mb-6">
                <div
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-1000",
                    isCourseFinished
                      ? "bg-[#FF6B00] shadow-[0_0_30px_#FF6B00] scale-110"
                      : "bg-white/5",
                  )}
                >
                  <Trophy
                    size={40}
                    className={
                      isCourseFinished ? "text-black" : "text-white/20"
                    }
                  />
                </div>
              </div>
              <h3 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">
                {isCourseFinished ? "¡Curso Completado!" : "Meta Final"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {isCourseFinished
                  ? "Has finalizado exitosamente toda la ruta de crecimiento."
                  : "Completa todas las etapas para desbloquear este logro."}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedLesson && (
          <VideoModal
            video={selectedLesson}
            // ✅ CAMBIO ACÁ: Ahora onClose recibe también si se bloqueó el video
            onClose={(wasCompleted: boolean, wasBlocked?: boolean) => {
              if (wasCompleted) {
                setLocalRoadmap((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex(
                    (l) => l.id === selectedLesson.id,
                  );
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], isCompleted: true };
                    if (idx + 1 < updated.length) {
                      updated[idx + 1] = {
                        ...updated[idx + 1],
                        isLocked: false,
                      };
                    }
                  }
                  return updated;
                });
              } else if (wasBlocked) {
                // Si el modal avisa que se bloqueó, lo inyectamos optimísticamente en el mapa
                setLocalRoadmap((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex(
                    (l) => l.id === selectedLesson.id,
                  );
                  if (idx !== -1) {
                    updated[idx] = {
                      ...updated[idx],
                      isOptimisticallyStuck: true,
                    };
                  }
                  return updated;
                });
              }
              setSelectedLesson(null);
              router.refresh(); // Actualizamos datos del servidor por detrás
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
