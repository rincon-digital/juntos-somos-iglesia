"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, Play, AlertTriangle, Trophy, ListChecks, ArrowRight } from "lucide-react";
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

  const lessonStatus = (lesson: any) => {
    const isStuck =
      lesson.isOptimisticallyStuck ||
      lesson.videoReview?.some((rev: any) => {
        const hasPassed = rev.examAnswers?.some((ans: any) => ans.response === rev.correctOption);
        return rev.examAnswers?.length >= 2 && !hasPassed;
      });
    return lesson.isCompleted ? "completed" : lesson.isLocked ? "locked" : isStuck ? "stuck" : "active";
  };

  const total = localRoadmap.length;
  const done = localRoadmap.filter((l: any) => l.isCompleted).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 text-[#0a0a0a] md:px-6">
      {/* ENCABEZADO DEL CURSO */}
      <header className="pt-6 md:pt-8">
        <p className="text-sm text-[#57534e]">Curso</p>
        <h1 className="text-3xl font-semibold capitalize leading-tight tracking-[-0.03em] text-balance md:text-4xl">
          {(courseName || "Curso").toLowerCase()}
        </h1>
        <div className="mt-5 rounded-2xl border border-[#e7e5e4] bg-white p-4">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-[#57534e]">
              <span className="font-semibold tabular-nums text-[#0a0a0a]">{done}</span> de{" "}
              <span className="tabular-nums">{total}</span> {total === 1 ? "clase completada" : "clases completadas"}
            </span>
            <span className="font-semibold tabular-nums text-[#C2410C]">{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance del curso"
            className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#f5f5f4]"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full bg-[#FF6B00]"
            />
          </div>
        </div>
      </header>

      {/* CLASES */}
      <ol className="mt-8">
        {localRoadmap.map((lesson: any, index: number) => {
          const status = lessonStatus(lesson);
          const isLast = index === localRoadmap.length - 1;
          const questions = lesson.videoReview?.length || 0;
          const canOpen = status === "active";

          return (
            <motion.li
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
              className="relative flex gap-4 pb-4"
            >
              {/* Paso: círculo + línea que lo une con el siguiente */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                    status === "completed" && "bg-green-600 text-white",
                    status === "active" && "bg-[#FF6B00] text-white ring-4 ring-[#FF6B00]/15",
                    status === "stuck" && "bg-amber-500 text-white",
                    status === "locked" && "border border-[#e7e5e4] bg-white text-[#a8a29e]",
                  )}
                >
                  {status === "completed" ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : index + 1}
                </span>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn("mt-1 w-0.5 flex-1 rounded-full", status === "completed" ? "bg-green-600/40" : "bg-[#e7e5e4]")}
                  />
                )}
              </div>

              {/* Tarjeta de la clase */}
              <div
                className={cn(
                  "mb-2 flex flex-1 flex-col gap-4 rounded-[1.5rem] border bg-white p-3 sm:flex-row sm:items-center",
                  status === "active" ? "border-[#FF6B00]/40 shadow-[0_8px_24px_rgba(255,107,0,0.08)]" : "border-[#e7e5e4]",
                  status === "locked" && "bg-[#fafaf9]",
                )}
              >
                <button
                  type="button"
                  onClick={() => canOpen && setSelectedLesson(lesson)}
                  disabled={!canOpen}
                  aria-label={canOpen ? `Ver la clase ${lesson.title}` : undefined}
                  tabIndex={canOpen ? 0 : -1}
                  className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] disabled:cursor-default sm:w-40"
                >
                  <img
                    src={`https://img.youtube.com/vi/${lesson.videoId?.trim()}/mqdefault.jpg`}
                    alt=""
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-500",
                      canOpen && "group-hover:scale-105",
                      status === "locked" && "opacity-40 grayscale",
                    )}
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    {status === "locked" ? (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#57534e]">
                        <Lock size={15} aria-hidden="true" />
                      </span>
                    ) : canOpen ? (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-transform duration-200 group-hover:scale-105">
                        <Play size={17} className="ml-0.5 fill-current" aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                </button>

                <div className="min-w-0 flex-1 px-1 sm:px-0">
                  <p className="text-xs text-[#57534e]">Clase {index + 1}</p>
                  <h3 className={cn("line-clamp-2 font-semibold leading-snug", status === "locked" && "text-[#a8a29e]")}>
                    {lesson.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[#57534e]">
                    <ListChecks size={14} aria-hidden="true" />
                    {questions} {questions === 1 ? "pregunta" : "preguntas"}
                  </p>
                </div>

                <div className="shrink-0 px-1 pb-1 sm:px-0 sm:pb-0 sm:pr-2">
                  {status === "active" && (
                    <button
                      type="button"
                      onClick={() => setSelectedLesson(lesson)}
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 sm:w-auto"
                    >
                      Empezar <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  )}
                  {status === "completed" && (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 text-sm font-medium text-green-700">
                      <Check size={14} strokeWidth={3} aria-hidden="true" /> Completada
                    </span>
                  )}
                  {status === "stuck" && (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#fffbeb] px-3 text-sm font-medium text-amber-800">
                      <AlertTriangle size={14} aria-hidden="true" /> En revisión del pastor
                    </span>
                  )}
                  {status === "locked" && (
                    <span className="text-sm text-[#a8a29e]">Se habilita al terminar la anterior</span>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {/* CIERRE DEL CURSO */}
      <div
        className={cn(
          "mt-4 flex items-center gap-4 rounded-[1.5rem] p-5",
          isCourseFinished ? "bg-[#FF6B00] text-black" : "border border-dashed border-[#d6d3d1] text-[#57534e]",
        )}
      >
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isCourseFinished ? "bg-black/10" : "bg-[#f5f5f4]",
          )}
        >
          <Trophy size={20} aria-hidden="true" />
        </span>
        <div>
          <p className={cn("font-semibold", isCourseFinished ? "text-black" : "text-[#0a0a0a]")}>
            {isCourseFinished ? "¡Curso completado!" : "Meta final"}
          </p>
          <p className={cn("text-sm", isCourseFinished && "text-black/70")}>
            {isCourseFinished ? "Terminaste todas las clases. ¡Felicitaciones!" : "Terminá todas las clases para completar el curso."}
          </p>
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
