"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Play,
  Loader2,
  Maximize,
  Minimize,
  RotateCcw,
} from "lucide-react";
import { userEvaluations } from "@/actions/user_course/evaluations/user.evaluations";
import { getVideoPosition, saveVideoPosition, saveClassFeedback } from "@/actions/course/video/video";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

// Retomar es proporcional al largo del video:
// se ofrece si vio al menos el 10% (entre 3 y 30 s) y le falta más del 10% (entre 1 y 10 s).
// Ej.: 10 s → desde 3 s y hasta 9 s · 2 min → desde 12 s y hasta 1:50 · 20 min → desde 30 s y hasta 19:50
const shouldOfferResume = (saved: number, total: number) => {
  if (!total) return saved >= 3;
  const minStart = Math.min(30, Math.max(3, total * 0.1));
  const endMargin = Math.min(10, Math.max(1, total * 0.1));
  return saved >= minStart && saved < total - endMargin;
};
// Cada cuánto se guarda el avance en la base de datos mientras mira
const SERVER_SAVE_EVERY_MS = 15000;

// Caritas animadas de Google (Noto Emoji); si no cargan, se ve el emoji del sistema
const FEEDBACK_OPTIONS = [
  { id: "like", label: "Me gustó", emoji: "😀", code: "1f600" },
  { id: "regular", label: "Regular", emoji: "😐", code: "1f610" },
  { id: "dislike", label: "No me gustó", emoji: "😕", code: "1f615" },
] as const;

const formatTime = (s: number) => {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

export default function VideoModal({ video, onClose }: any) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showEndScreen, setShowEndScreen] = useState<boolean>(false);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastServerSave = useRef(0);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const storageKey = `jsi_video_pos_${video.id}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!modalRef.current) return;
    try {
      if (!document.fullscreenElement) {
        const el: any = modalRef.current;
        await (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
        setIsFullscreen(true);
      } else {
        const d: any = document;
        await (d.exitFullscreen || d.webkitExitFullscreen || d.msExitFullscreen)?.call(d);
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Error al alternar pantalla completa:", err);
    }
  };

  // ── Avance: en el navegador al instante y en la base de datos cada tanto ──
  const readTime = () => {
    try {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        return playerRef.current.getCurrentTime() as number;
      }
    } catch {}
    return 0;
  };

  const savePosition = (seconds: number, toServer: boolean) => {
    if (seconds <= 1) return;
    try {
      localStorage.setItem(storageKey, String(seconds));
    } catch {}
    if (toServer) {
      lastServerSave.current = Date.now();
      saveVideoPosition(video.id, seconds).catch(() => {});
    }
  };

  const clearPosition = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    saveVideoPosition(video.id, 0).catch(() => {});
  };

  const handleClose = (completed: boolean, isBlocked: boolean = false) => {
    if (!isVideoEnded) savePosition(readTime(), true);
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen?.();
      } catch {}
    }
    onClose(completed, isBlocked);
  };

  // Cargar YouTube IFrame API
  useEffect(() => {
    if (!isMounted || !video?.videoId) return;

    const initPlayer = () => {
      if (playerRef.current) return;

      playerRef.current = new (window as any).YT.Player("yt-player", {
        events: {
          onReady: async () => {
            setIsPlayerReady(true);
            const total = playerRef.current?.getDuration?.() || 0;
            setDuration(total);

            // El punto más avanzado entre este navegador y la base de datos
            let local = 0;
            try {
              local = parseFloat(localStorage.getItem(storageKey) || "0") || 0;
            } catch {}
            const server = await getVideoPosition(video.id).catch(() => 0);
            const saved = Math.max(local, server || 0);
            if (shouldOfferResume(saved, total)) {
              setResumeAt(saved);
            }
          },
          onStateChange: (event: any) => {
            // 1 = reproduciendo, 2 = pausa, 0 = terminó, 3 = cargando
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) {
              setIsPlaying(false);
              savePosition(readTime(), true);
            }
            setIsBuffering(event.data === 3);

            if (event.data === 0) {
              setIsVideoEnded(true);
              setShowEndScreen(true);
              setIsPlaying(false);
              clearPosition();
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      if (!document.getElementById("youtube-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const previousOnReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (previousOnReady) previousOnReady();
        initPlayer();
      };
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
      playerRef.current = null;
      setIsPlayerReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, video?.videoId, video?.id]);

  // Mientras se reproduce: barra de avance cada segundo, navegador cada 2 s, base cada 15 s
  useEffect(() => {
    if (!isPlaying || !isPlayerReady) return;
    let ticks = 0;
    const interval = setInterval(() => {
      const t = readTime();
      setCurrent(t);
      ticks++;
      if (ticks % 2 === 0) {
        savePosition(t, Date.now() - lastServerSave.current > SERVER_SAVE_EVERY_MS);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isPlayerReady, video?.id]);

  const questions = video.videoReview || [];

  const startingIndex = useMemo(() => {
    const pendingIndex = questions.findIndex(
      (q: any) => !q.examAnswers?.some((a: any) => a.response === q.correctOption && !a.isArchived),
    );
    return pendingIndex !== -1 ? pendingIndex : 0;
  }, [questions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(startingIndex);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [step, setStep] = useState<"video" | "quiz" | "warning" | "blocked" | "completed" | "feedback">("video");
  const [rating, setRating] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Después de "¡Clase aprobada!" se pregunta qué le pareció
  const goToFeedback = () => setTimeout(() => setStep("feedback"), 1600);

  const sendFeedback = async () => {
    if (!rating) return;
    setSendingFeedback(true);
    const res = await saveClassFeedback(video.id, rating, comment);
    setSendingFeedback(false);
    if (res && "error" in res) toast.error(res.error);
    else toast.success("¡Gracias por tu opinión!");
    handleClose(true);
  };

  const play = () => playerRef.current?.playVideo?.();

  const handlePlayPause = () => {
    if (!playerRef.current || !isPlayerReady || typeof playerRef.current.playVideo !== "function") return;
    if (isPlaying) playerRef.current.pauseVideo();
    else play();
  };

  const resumeFrom = (seconds: number) => {
    try {
      playerRef.current?.seekTo?.(seconds, true);
    } catch {}
    setCurrent(seconds);
    setResumeAt(null);
    play();
  };

  const startOver = () => {
    clearPosition();
    resumeFrom(0);
  };

  const handleQuizAnswer = async (selectedOption: string) => {
    if (!questions[currentQuestionIndex]) return;
    setIsSaving(true);
    const res = await userEvaluations({
      questionId: questions[currentQuestionIndex].id,
      response: selectedOption as "A" | "B" | "C",
    });
    setIsSaving(false);

    if ("error" in res) {
      if (res.isHardBlocked) setStep("blocked");
      else toast.error(res.error);
      return;
    }

    if (res.success === "Correcto") {
      if (currentQuestionIndex < questions.length - 1) {
        toast.success("¡Correcto!");
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setStep("completed");
        goToFeedback();
      }
    } else {
      toast.error("Respuesta incorrecta. Volvé a intentarlo.");
      res.isHardBlocked ? setStep("blocked") : setStep("warning");
    }
  };

  if (!isMounted) return null;

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const iconButton =
    "flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]";

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm md:p-6 font-[family-name:var(--font-poppins)]">
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-clase"
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className={`relative flex w-full flex-col overflow-hidden text-[#0a0a0a] ${
          isFullscreen
            ? "h-screen w-screen bg-black"
            : "h-full max-w-5xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)] md:h-auto md:rounded-[2rem]"
        }`}
      >
        {/* ENCABEZADO */}
        {!isFullscreen && (
          <header className="flex items-center justify-between gap-4 border-b border-[#e7e5e4] px-5 py-4 md:px-6">
            <div className="min-w-0">
              <p className="text-sm text-[#57534e]">{video.order ? `Clase ${video.order}` : "Clase"}</p>
              <h2 id="titulo-clase" className="truncate text-lg font-semibold tracking-[-0.01em]">
                {video.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {step === "video" && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Pantalla completa"
                  className={`${iconButton} text-[#57534e] hover:bg-[#f5f5f4] hover:text-[#0a0a0a]`}
                >
                  <Maximize size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleClose(step === "feedback" || step === "completed", step === "blocked")}
                aria-label="Cerrar"
                className={`${iconButton} text-[#57534e] hover:bg-[#f5f5f4] hover:text-[#0a0a0a]`}
              >
                <X size={20} />
              </button>
            </div>
          </header>
        )}

        {/* VIDEO: el iframe nunca se desmonta, solo se oculta */}
        <div
          className={`relative w-full bg-black ${step === "video" ? "block" : "hidden"} ${
            isFullscreen ? "flex-1" : "aspect-video"
          }`}
        >
          {video?.videoId ? (
            <>
              <iframe
                id="yt-player"
                title={video.title}
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${video.videoId.trim()}?rel=0&modestbranding=1&enablejsapi=1&controls=0&disablekb=1&fs=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />

              {/* Capa que maneja play/pausa (bloquea el clic directo a YouTube) */}
              {!showEndScreen && resumeAt === null && (
                <button
                  type="button"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? "Pausar" : "Reproducir"}
                  className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-none"
                >
                  <AnimatePresence>
                    {(!isPlaying || isBuffering || !isPlayerReady) && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                          {!isPlayerReady || isBuffering ? (
                            <Loader2 size={26} className="animate-spin" />
                          ) : (
                            <Play size={26} className="ml-1 fill-current" />
                          )}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )}

              {/* Retomar donde quedó */}
              <AnimatePresence>
                {resumeAt !== null && !showEndScreen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full max-w-sm rounded-[1.75rem] bg-white p-6 text-center"
                    >
                      <p className="text-sm text-[#57534e]">Te quedaste en</p>
                      <p className="text-3xl font-semibold tabular-nums tracking-[-0.02em]">{formatTime(resumeAt)}</p>
                      <div className="mt-5 grid gap-2">
                        <button
                          type="button"
                          onClick={() => resumeFrom(resumeAt)}
                          autoFocus
                          className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                        >
                          <Play size={15} className="fill-current" aria-hidden="true" /> Seguir desde {formatTime(resumeAt)}
                        </button>
                        <button
                          type="button"
                          onClick={startOver}
                          className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                        >
                          <RotateCcw size={15} aria-hidden="true" /> Empezar de nuevo
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terminó el video */}
              <AnimatePresence>
                {showEndScreen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                  >
                    <div className="w-full max-w-sm rounded-[1.75rem] bg-white p-6 text-center">
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ecfdf5] text-green-700">
                        <CheckCircle2 size={24} aria-hidden="true" />
                      </span>
                      <h3 className="mt-3 text-xl font-semibold tracking-[-0.01em]">Terminaste la clase</h3>
                      <p className="mt-1 text-sm text-[#57534e]">
                        {questions.length > 0
                          ? `Respondé ${questions.length === 1 ? "la pregunta" : `las ${questions.length} preguntas`} para seguir.`
                          : "Ya podés seguir con la próxima clase."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (questions.length > 0) setStep("quiz");
                          else {
                            setStep("completed");
                            goToFeedback();
                          }
                        }}
                        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                      >
                        {questions.length > 0 ? "Responder preguntas" : "Continuar"} <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Avance del video (solo muestra, no deja adelantar) */}
              {duration > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-xs tabular-nums text-white/90">
                  <span>{formatTime(current)}</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                    <span className="block h-full rounded-full bg-[#FF6B00]" style={{ width: `${progress}%` }} />
                  </span>
                  <span>{formatTime(duration)}</span>
                </div>
              )}

              {isFullscreen && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Salir de pantalla completa"
                  className={`${iconButton} absolute right-4 top-4 z-30 bg-black/50 text-white hover:bg-black/70`}
                >
                  <Minimize size={18} />
                </button>
              )}
            </>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-white/60">No se encontró el video.</p>
          )}
        </div>

        {/* PREGUNTAS Y MENSAJES */}
        {step !== "video" && (
          <div className="flex min-h-[26rem] flex-1 items-center justify-center p-6 md:p-10">
            {step === "quiz" && (
              <div className="w-full max-w-xl">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {questions.map((_: any, i: number) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < currentQuestionIndex ? "bg-[#FF6B00]" : i === currentQuestionIndex ? "bg-[#0a0a0a]" : "bg-[#e7e5e4]"
                      }`}
                    />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <p className="mt-6 text-sm text-[#57534e]">
                      Pregunta {currentQuestionIndex + 1} de {questions.length}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold leading-snug tracking-[-0.01em] text-balance md:text-2xl">
                      {questions[currentQuestionIndex]?.question}
                    </h3>
                    <div className="mt-6 grid gap-2.5">
                      {(["A", "B", "C"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleQuizAnswer(opt)}
                          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-[#e7e5e4] bg-white px-4 py-3 text-left text-[15px] transition-colors hover:border-[#FF6B00] hover:bg-[#fff7ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] disabled:opacity-60"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-sm font-semibold">
                            {opt}
                          </span>
                          {questions[currentQuestionIndex]?.[`option${opt}`]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {step === "warning" && (
              <div className="max-w-sm text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fffbeb] text-amber-700">
                  <AlertTriangle size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.01em]">Respuesta incorrecta</h3>
                <p className="mt-2 text-sm text-[#57534e]">Volvé a mirar la clase con atención e intentalo de nuevo.</p>
                <button
                  type="button"
                  onClick={() => {
                    setStep("video");
                    setShowEndScreen(false);
                    setIsVideoEnded(false);
                    setCurrent(0);
                    setTimeout(() => playerRef.current?.loadVideoById?.(video.videoId), 300);
                  }}
                  className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  <RotateCcw size={15} aria-hidden="true" /> Volver a ver la clase
                </button>
              </div>
            )}

            {step === "blocked" && (
              <div className="max-w-sm text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-red-700">
                  <AlertCircle size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.01em]">Se terminaron los intentos</h3>
                <p className="mt-2 text-sm text-[#57534e]">
                  El pastor va a revisar tus respuestas y te va a habilitar para que vuelvas a intentar.
                </p>
                <button
                  type="button"
                  onClick={() => handleClose(false, true)}
                  className="mt-6 inline-flex h-12 items-center rounded-full border border-[#e7e5e4] px-6 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Volver al curso
                </button>
              </div>
            )}

            {step === "feedback" && (
              <div className="w-full max-w-md text-center">
                <p className="text-sm text-[#57534e]">Antes de seguir…</p>
                <h3 className="mt-1 text-xl font-semibold leading-snug tracking-[-0.01em] text-balance md:text-2xl">
                  ¿Qué te pareció la clase <span className="text-[#C2410C]">“{video.title}”</span>?
                </h3>

                <div role="radiogroup" aria-label="Tu opinión de la clase" className="mt-6 grid grid-cols-3 gap-2.5">
                  {FEEDBACK_OPTIONS.map((o) => {
                    const selected = rating === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setRating(o.id)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition-[border-color,background-color,transform] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                          selected
                            ? "border-[#FF6B00] bg-[#fff7ed]"
                            : "border-[#e7e5e4] bg-white hover:border-[#d6d3d1] hover:bg-[#fafaf9]"
                        } ${rating && !selected ? "opacity-60" : ""}`}
                      >
                        <img
                          src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${o.code}/512.webp`}
                          alt={o.emoji}
                          width={56}
                          height={56}
                          className={`h-14 w-14 transition-transform duration-200 ${selected ? "scale-110" : ""}`}
                        />
                        <span className={`text-sm font-medium ${selected ? "text-[#C2410C]" : ""}`}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {rating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <label htmlFor="comentario-clase" className="mt-5 block text-left text-sm font-medium text-[#292524]">
                        ¿Querés contarle algo al pastor? <span className="font-normal text-[#a8a29e]">(opcional)</span>
                      </label>
                      <textarea
                        id="comentario-clase"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Lo que más te sirvió, una duda, algo que no se entendió…"
                        className="mt-1.5 w-full resize-none rounded-xl border border-[#e7e5e4] bg-white p-3.5 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleClose(true)}
                    className="h-12 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    Omitir
                  </button>
                  <button
                    type="button"
                    onClick={sendFeedback}
                    disabled={!rating || sendingFeedback}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#e7e5e4] disabled:text-[#57534e] disabled:active:scale-100"
                  >
                    {sendingFeedback && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {step === "completed" && (
              <div className="text-center">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white"
                >
                  <CheckCircle2 size={30} aria-hidden="true" />
                </motion.span>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">¡Clase aprobada!</h3>
                <p className="mt-1 text-sm text-[#57534e]">Ya se habilitó la próxima clase.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
