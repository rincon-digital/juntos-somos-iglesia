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
} from "lucide-react";
import { userEvaluations } from "@/actions/user_course/evaluations/user.evaluations";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function VideoModal({ video, onClose }: any) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showEndScreen, setShowEndScreen] = useState<boolean>(false);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cargar YouTube IFrame API
  useEffect(() => {
    if (!isMounted || !video?.videoId) return;

    const initPlayer = () => {
      if (playerRef.current) return;

      playerRef.current = new (window as any).YT.Player("yt-player", {
        events: {
          onReady: () => {
            setIsPlayerReady(true);
          },
          onStateChange: (event: any) => {
            // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) setIsPlaying(false);

            if (event.data === 3) {
              setIsBuffering(true);
            } else {
              setIsBuffering(false);
            }

            if (event.data === 0) {
              setIsVideoEnded(true);
              setShowEndScreen(true);
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      // Si la API no está, la cargamos
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
      // No reseteamos onYouTubeIframeAPIReady para no romper otras instancias
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      setIsPlayerReady(false);
    };
  }, [isMounted, video?.videoId]);

  const questions = video.videoReview || [];

  const startingIndex = useMemo(() => {
    const pendingIndex = questions.findIndex(
      (q: any) =>
        !q.examAnswers?.some(
          (a: any) => a.response === q.correctOption && !a.isArchived,
        ),
    );
    return pendingIndex !== -1 ? pendingIndex : 0;
  }, [questions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState<number>(startingIndex);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [step, setStep] = useState<
    "video" | "quiz" | "warning" | "blocked" | "completed"
  >("video");

  const handlePlayPause = () => {
    if (
      !playerRef.current ||
      !isPlayerReady ||
      typeof playerRef.current.playVideo !== "function"
    ) {
      console.warn("Reproductor no listo todavía.");
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
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
        setTimeout(() => onClose(true), 2500);
      }
    } else {
      toast.error("Respuesta incorrecta. Volvé a intentarlo.");
      res.isHardBlocked ? setStep("blocked") : setStep("warning");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl bg-[#080808] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Botón cerrar */}
        <div className="absolute top-6 right-6 z-[60]">
          <button
            onClick={() => onClose(false, step === "blocked")}
            className="w-12 h-12 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`w-full bg-black relative transition-all duration-500 ${step === "video" ? "aspect-video" : "min-h-[85vh] md:min-h-0 md:aspect-video"}`}>
          {/* ── STEP: VIDEO ── */}
          {/* Usamos display dinámico para no desmontar el iframe nunca */}
          <div
            className={`absolute inset-0 w-full h-full ${step === "video" ? "block" : "hidden"}`}
          >
            {video?.videoId ? (
              <>
                {/* iframe sin controles */}
                <iframe
                  id="yt-player"
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${video.videoId.trim()}?rel=0&modestbranding=1&enablejsapi=1&controls=0&disablekb=1&fs=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />

                {/* Overlay que bloquea click directo al iframe */}
                {!showEndScreen && (
                  <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={handlePlayPause}
                  >
                    {/* Título */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-black via-black/40 to-transparent flex justify-between items-end">
                      <h2 className="text-3xl md:text-5xl font-black uppercase italic text-white tracking-tighter drop-shadow-lg">
                        {video.title}
                      </h2>
                    </div>

                    {/* Botón play/pause centrado */}
                    <AnimatePresence>
                      {(!isPlaying || isBuffering || !isPlayerReady) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-20 h-20 bg-[#FF6B00] rounded-full flex items-center justify-center shadow-2xl">
                            {!isPlayerReady || isBuffering ? (
                              <Loader2
                                size={32}
                                className="text-black animate-spin"
                              />
                            ) : (
                              <Play
                                size={32}
                                className="text-black fill-black ml-1"
                              />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Pantalla final cuando termina el video */}
                <AnimatePresence>
                  {showEndScreen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center gap-6 p-10"
                    >
                      <CheckCircle2 size={56} className="text-[#FF6B00]" />
                      <h3 className="text-3xl font-black uppercase italic text-white text-center">
                        ¡Clase Finalizada!
                      </h3>
                      <p className="text-white/50 text-sm uppercase tracking-widest text-center">
                        {questions.length > 0
                          ? "Ahora completá la evaluación para continuar"
                          : "¡Muy bien! Ya podés continuar con la siguiente clase"}
                      </p>

                      {questions.length > 0 ? (
                        <button
                          onClick={() => setStep("quiz")}
                          className="bg-[#FF6B00] text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center gap-3"
                        >
                          Realizar Evaluación <ArrowRight size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setStep("completed");
                            setTimeout(() => onClose(true), 2000);
                          }}
                          className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-400 transition-all flex items-center gap-3"
                        >
                          Continuar <CheckCircle2 size={18} />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20 uppercase font-black text-xs">
                Error: No se encontró el ID de YouTube
              </div>
            )}
          </div>

          {/* ── STEP: QUIZ ── */}
          {step === "quiz" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-20 gap-6 md:gap-8 overflow-y-auto">
              {/* Progreso */}
              <div className="w-full flex items-center gap-2 max-w-2xl">
                {questions.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i < currentQuestionIndex
                        ? "bg-[#FF6B00]"
                        : i === currentQuestionIndex
                          ? "bg-white"
                          : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Pregunta */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="w-full flex flex-col items-center gap-6"
                >
                  <p className="text-xs uppercase tracking-widest text-white/30 font-black">
                    Pregunta {currentQuestionIndex + 1} de {questions.length}
                  </p>
                  <h3 className="text-lg md:text-2xl font-black uppercase italic text-white text-center px-2">
                    {questions[currentQuestionIndex]?.question}
                  </h3>

                  <div className="w-full max-w-2xl grid grid-cols-1 gap-3 mt-2">
                    {(["A", "B", "C"] as const).map((opt) => {
                      const label =
                        opt === "A"
                          ? questions[currentQuestionIndex]?.optionA
                          : opt === "B"
                            ? questions[currentQuestionIndex]?.optionB
                            : questions[currentQuestionIndex]?.optionC;

                      return (
                        <button
                          key={opt}
                          disabled={isSaving}
                          onClick={() => handleQuizAnswer(opt)}
                          className="w-full flex items-center gap-4 bg-white/5 border border-white/10 hover:border-[#FF6B00] hover:bg-[#FF6B00]/10 text-white rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 font-bold text-xs md:text-sm transition-all disabled:opacity-50 text-left"
                        >
                          <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-xs shrink-0">
                            {opt}
                          </span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── STEP: WARNING (respuesta incorrecta) ── */}
          {step === "warning" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 gap-6">
              <AlertTriangle size={56} className="text-yellow-400" />
              <h3 className="text-2xl font-black uppercase italic text-white text-center">
                Respuesta Incorrecta
              </h3>
              <p className="text-white/50 text-sm text-center">
                Volvé a ver el video con atención e intentalo de nuevo.
              </p>
              <button
                onClick={() => {
                  setStep("video");
                  setShowEndScreen(false);
                  setIsVideoEnded(false);

                  setTimeout(() => {
                    if (
                      playerRef.current &&
                      typeof playerRef.current.loadVideoById === "function"
                    ) {
                      playerRef.current.loadVideoById(video.videoId);
                    }
                  }, 300);
                }}
                className="bg-yellow-400 text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
              >
                Volver al Video
              </button>
            </div>
          )}

          {/* ── STEP: BLOCKED ── */}
          {step === "blocked" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 gap-6">
              <AlertCircle size={56} className="text-red-500" />
              <h3 className="text-2xl font-black uppercase italic text-white text-center">
                Acceso Bloqueado
              </h3>
              <p className="text-white/50 text-sm text-center">
                Has superado el límite de intentos. Contactá a tu instructor.
              </p>
              <button
                onClick={() => onClose(false, true)}
                className="bg-red-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* ── STEP: COMPLETED ── */}
          {step === "completed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 size={72} className="text-green-400" />
              </motion.div>
              <h3 className="text-3xl font-black uppercase italic text-white text-center">
                ¡Completado!
              </h3>
              <p className="text-white/50 text-sm uppercase tracking-widest text-center">
                Clase aprobada con éxito
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
