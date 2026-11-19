"use client";
import { useState, useEffect } from "react";
import {
  Video,
  Plus,
  Youtube,
  AlertCircle,
  X,
  Play,
  BookOpen,
  CheckCircle2,
  Pencil,
  Trash2,
  Save,
  ChevronLeft,
  MessageSquareText,
  Smile,
} from "lucide-react";
import { getVideoErrorStats } from "@/actions/course/video/evaluations/evaluations.stats";
import {
  createCourseVideo,
  deleteVideo,
  updateVideo,
} from "@/actions/course/video/video";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import EvaluationForm from "../evaluation/EvaluationForm";

// Caritas de la opinión del alumno (mismas que ve él al aprobar la clase)
const FEEDBACK = {
  like: { label: "Me gustó", emoji: "😀", cls: "bg-[#ecfdf5] text-green-800" },
  regular: { label: "Regular", emoji: "😐", cls: "bg-[#fffbeb] text-amber-800" },
  dislike: { label: "No me gustó", emoji: "😕", cls: "bg-[#fef2f2] text-red-800" },
} as const;

export default function CourseVideoManager({ course }: any) {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>(course.video || []);
  const [stats, setStats] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingQuestionTo, setAddingQuestionTo] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editVideoData, setEditVideoData] = useState({ title: "", order: 0 });
  const [modalVideo, setModalVideo] = useState<any | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<any | null>(null);
  const [feedbackVideo, setFeedbackVideo] = useState<any | null>(null);

  const [newVideo, setNewVideo] = useState({
    title: "",
    videoUrl: "",
    order: videos.length + 1,
  });

  useEffect(() => {
    if (course.id) getVideoErrorStats(course.id).then(setStats);
    setVideos(course.video || []);
  }, [course.id, course.video]);

  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
      if (course.id) getVideoErrorStats(course.id).then(setStats);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [course.id, router]);

  // Esto mantiene sincronizado el modal abierto si cambia el array de videos
  useEffect(() => {
    if (modalVideo) {
      const updated = videos.find((v) => v.id === modalVideo.id);
      if (updated) setModalVideo(updated);
    }
  }, [videos]);

  const getYouTubeThumbnail = (url: string) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
    return null;
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match2 = url.match(regExp);
    return match2 && match2[2].length === 11 ? match2[2] : "";
  };

  // ✅ SOLUCIÓN 1: Inyectar el video al instante sin recargar
  const handleSaveVideo = async () => {
    if (!newVideo.title || !newVideo.videoUrl) {
      toast.error("Por favor, completa los campos");
      return;
    }

    const res = await createCourseVideo({
      ...newVideo,
      courseId: course.id,
    } as any);

    if (res.success) {
      toast.success("¡Clase añadida con éxito!");

      const extractedId = extractYouTubeId(newVideo.videoUrl);
      const optimisticVideo = {
        id: res.videoId,
        title: newVideo.title,
        order: Number(newVideo.order),
        videoId: extractedId,
        videoReview: [],
      };

      setVideos((prev) => {
        const updated = [...prev, optimisticVideo].sort(
          (a, b) => a.order - b.order,
        );
        // Reseteamos el formulario y asignamos el SIGUIENTE número de orden
        setNewVideo({
          title: "",
          videoUrl: "",
          order: updated.length + 1,
        });
        return updated;
      });

      setShowAddForm(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    const res = await deleteVideo(id);
    if (res.success) {
      toast.success(res.success);
      setVideos(videos.filter((v) => v.id !== id));
      setVideoToDelete(null);
      router.refresh();
    } else {
      toast.error(res.error || "Error al eliminar");
    }
  };

  const startEditing = (video: any) => {
    setEditingVideoId(video.id);
    setEditVideoData({ title: video.title, order: video.order });
  };

  const handleUpdateVideo = async (id: string) => {
    const res = await updateVideo({
      id,
      title: editVideoData.title,
      order: Number(editVideoData.order),
    });

    if (res.success) {
      toast.success("Actualizado");
      setVideos((prev) =>
        prev
          .map((v) => (v.id === id ? { ...v, ...editVideoData } : v))
          .sort((a, b) => a.order - b.order),
      );
      setEditingVideoId(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const openModal = (video: any) => {
    setModalVideo(video);
    setAddingQuestionTo(null);
  };

  const handleQuestionAdded = (videoId: string, newQuestionData?: any) => {
    setVideos((prevVideos) =>
      prevVideos.map((v) => {
        if (v.id === videoId) {
          const questionWithId = {
            ...newQuestionData,
            id: newQuestionData?.id || Date.now().toString(),
          };

          return {
            ...v,
            videoReview: [...(v.videoReview || []), questionWithId],
          };
        }
        return v;
      }),
    );
    setAddingQuestionTo(null);
    router.refresh();
  };

  const sortedVideos = [...videos].sort((a, b) => a.order - b.order);
  const inputClass =
    "h-11 w-full rounded-xl border border-[#e7e5e4] bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30";
  const backButton =
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-[#e7e5e4] pl-3 pr-4 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]";
  const primaryButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2";

  const closeQuestions = () => {
    setModalVideo(null);
    setAddingQuestionTo(null);
  };

  return (
    <div className="w-full space-y-5 text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      {feedbackVideo ? (
        /* ── OPINIONES DE UNA CLASE (en la misma sección) ── */
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setFeedbackVideo(null)} className={backButton}>
              <ChevronLeft size={16} aria-hidden="true" /> Volver a las clases
            </button>
            <div className="min-w-0">
              <p className="text-sm text-[#57534e]">Clase {feedbackVideo.order} · Opiniones</p>
              <h3 className="truncate text-lg font-semibold leading-tight tracking-[-0.01em]">{feedbackVideo.title}</h3>
            </div>
          </div>

          {(() => {
            const list = feedbackVideo.classFeedback || [];
            const counts = (Object.keys(FEEDBACK) as (keyof typeof FEEDBACK)[]).map((k) => ({
              key: k,
              n: list.filter((f: any) => f.rating === k).length,
            }));
            return (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {counts.map(({ key, n }) => (
                    <div key={key} className="flex items-center gap-3 rounded-2xl border border-[#e7e5e4] bg-white p-4">
                      <span className="text-3xl" aria-hidden="true">{FEEDBACK[key].emoji}</span>
                      <div>
                        <p className="text-2xl font-semibold tabular-nums leading-none">{n}</p>
                        <p className="mt-1 text-sm text-[#57534e]">{FEEDBACK[key].label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {list.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#e7e5e4] px-6 py-12 text-center">
                    <p className="font-semibold">Todavía no hay opiniones</p>
                    <p className="mt-1 text-sm text-[#57534e]">Aparecen cuando los alumnos aprueban esta clase.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#f5f5f4] rounded-2xl border border-[#e7e5e4]">
                    {list.map((f: any) => {
                      const meta = FEEDBACK[f.rating as keyof typeof FEEDBACK] || FEEDBACK.regular;
                      return (
                        <li key={f.id} className="flex gap-3 p-4">
                          <span className="text-2xl leading-none" aria-label={meta.label}>{meta.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <p className="font-medium">{f.user?.fullName || "Alumno"}</p>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                              <time dateTime={f.createdAt} className="text-xs text-[#a8a29e]">
                                {new Date(f.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                              </time>
                            </div>
                            {f.comment ? (
                              <p className="mt-1 whitespace-pre-wrap text-sm text-[#44403c]">{f.comment}</p>
                            ) : (
                              <p className="mt-1 text-sm text-[#a8a29e]">Sin comentario</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            );
          })()}
        </div>
      ) : modalVideo ? (
        /* ── PREGUNTAS DE UNA CLASE (en la misma sección) ── */
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={closeQuestions} className={backButton}>
              <ChevronLeft size={16} aria-hidden="true" /> Volver a las clases
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f5f5f4]">
                <img
                  src={`https://img.youtube.com/vi/${modalVideo.videoId}/mqdefault.jpg`}
                  className="h-full w-full object-cover"
                  alt=""
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[#57534e]">Clase {modalVideo.order} · Preguntas</p>
                <h3 className="truncate text-lg font-semibold leading-tight tracking-[-0.01em]">{modalVideo.title}</h3>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {(modalVideo.videoReview || []).map((review: any, index: number) => (
              <div key={review.id || `temp-${index}`} className="overflow-hidden rounded-2xl border border-[#e7e5e4]">
                <p className="border-b border-[#e7e5e4] bg-[#fafaf9] px-5 py-3 text-sm font-medium">Pregunta {index + 1}</p>
                <div className="p-5">
                  <EvaluationForm
                    videoId={modalVideo.id}
                    initialData={review}
                    onSuccess={(data: any) => handleQuestionAdded(modalVideo.id, data)}
                  />
                </div>
              </div>
            ))}

            {addingQuestionTo === modalVideo.id || !modalVideo.videoReview?.length ? (
              <div className="overflow-hidden rounded-2xl border border-[#fed7aa]">
                <div className="flex items-center justify-between border-b border-[#fed7aa] bg-[#fff7ed] px-5 py-3">
                  <p className="text-sm font-medium text-[#9a3412]">
                    {modalVideo.videoReview?.length ? "Nueva pregunta" : "Primera pregunta"}
                  </p>
                  {modalVideo.videoReview?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddingQuestionTo(null)}
                      className="inline-flex items-center gap-1 text-sm text-[#57534e] transition-colors hover:text-red-700"
                    >
                      <X size={14} aria-hidden="true" /> Cancelar
                    </button>
                  )}
                </div>
                <div className="p-5">
                  <EvaluationForm
                    videoId={modalVideo.id}
                    onSuccess={(data: any) => handleQuestionAdded(modalVideo.id, data)}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingQuestionTo(modalVideo.id)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d6d3d1] text-sm font-medium text-[#57534e] transition-colors hover:border-[#FF6B00] hover:bg-[#fff7ed] hover:text-[#C2410C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <Plus size={16} aria-hidden="true" /> Agregar otra pregunta
              </button>
            )}
          </div>
        </div>
      ) : showAddForm ? (
        /* ── NUEVA CLASE (en la misma sección) ── */
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setShowAddForm(false)} className={backButton}>
              <ChevronLeft size={16} aria-hidden="true" /> Volver a las clases
            </button>
            <h3 className="text-lg font-semibold tracking-[-0.01em]">Nueva clase</h3>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clase-titulo" className="text-sm font-medium text-[#292524]">Título de la clase</label>
              <input
                id="clase-titulo"
                type="text"
                placeholder="Ej: El poder de la oración"
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clase-url" className="text-sm font-medium text-[#292524]">Link de YouTube</label>
              <div className="relative">
                <Youtube size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-red-600" />
                <input
                  id="clase-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={newVideo.videoUrl}
                  onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            {newVideo.videoUrl && getYouTubeThumbnail(newVideo.videoUrl) && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={getYouTubeThumbnail(newVideo.videoUrl)!}
                alt="Vista previa del video"
                className="aspect-video w-full max-w-sm rounded-2xl object-cover"
              />
            )}

            <button type="button" onClick={handleSaveVideo} className={`${primaryButton} h-12 w-full`}>
              Publicar clase
            </button>
          </div>
        </div>
      ) : (
        /* ── LISTA DE CLASES ── */
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[#57534e]">
              <span className="font-semibold tabular-nums text-[#0a0a0a]">{videos.length}</span>{" "}
              {videos.length === 1 ? "clase" : "clases"} · cada una puede tener preguntas de evaluación
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setEditingVideoId(null);
              }}
              className={primaryButton}
            >
              <Plus size={16} aria-hidden="true" /> Nueva clase
            </button>
          </div>

          {videos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e7e5e4] px-6 py-16 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e]">
                <Video size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-semibold">Todavía no hay clases</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[#57534e]">Agregá la primera con el botón “Nueva clase”.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sortedVideos.map((video, idx) => {
                const videoStat = stats.find((st) => st.videoId === video.id);
                const approved = videoStat?.aprobados || 0;
                const stuck = videoStat?.trabados || 0;
                const enrolled = videoStat?.inscriptos || 0;
                const questions = video.videoReview?.length || 0;
                const feedback = video.classFeedback || [];
                const likes = feedback.filter((f: any) => f.rating === "like").length;
                const regular = feedback.filter((f: any) => f.rating === "regular").length;
                const dislikes = feedback.filter((f: any) => f.rating === "dislike").length;

                return (
                  <motion.li
                    key={video.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-2xl border border-[#e7e5e4] bg-white transition-colors hover:border-[#d6d3d1]"
                  >
                    {editingVideoId === video.id ? (
                      <div className="space-y-4 p-5">
                        <div className="grid grid-cols-[1fr_8rem] gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor={`editar-titulo-${video.id}`} className="text-sm font-medium text-[#292524]">Título</label>
                            <input
                              id={`editar-titulo-${video.id}`}
                              type="text"
                              value={editVideoData.title}
                              onChange={(e) => setEditVideoData({ ...editVideoData, title: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor={`editar-orden-${video.id}`} className="text-sm font-medium text-[#292524]">Orden</label>
                            <input
                              id={`editar-orden-${video.id}`}
                              type="number"
                              min="1"
                              value={editVideoData.order}
                              onChange={(e) => setEditVideoData({ ...editVideoData, order: Number(e.target.value) })}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingVideoId(null)}
                            className="h-10 rounded-full border border-[#e7e5e4] px-5 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                          >
                            Cancelar
                          </button>
                          <button type="button" onClick={() => handleUpdateVideo(video.id)} className={primaryButton}>
                            <Save size={15} aria-hidden="true" /> Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-3 pr-4">
                        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f5f5f4]">
                          <img
                            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                            className="h-full w-full object-cover"
                            alt=""
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <Play size={14} className="fill-white text-white" aria-hidden="true" />
                          </span>
                        </div>

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                            stuck > 0 ? "bg-[#fef2f2] text-red-700" : "bg-[#f5f5f4] text-[#57534e]"
                          }`}
                        >
                          {video.order}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold">{video.title}</h4>
                          <p className="mt-0.5 flex items-center gap-4 text-sm text-[#57534e]">
                            <span className="flex items-center gap-1.5" title="Alumnos que aprobaron esta clase">
                              <CheckCircle2 size={14} aria-hidden="true" />
                              {enrolled > 0 ? `${approved} de ${enrolled} aprobaron` : `${approved} aprobaron`}
                            </span>
                            {stuck > 0 && (
                              <span
                                className="flex items-center gap-1.5 rounded-full bg-[#fef2f2] px-2 py-0.5 font-medium text-red-700"
                                title="Fallaron 2 veces una pregunta: habilitales el reintento desde Alumnos"
                              >
                                <AlertCircle size={14} aria-hidden="true" /> {stuck} {stuck === 1 ? "trabado" : "trabados"}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <BookOpen size={14} aria-hidden="true" /> {questions} {questions === 1 ? "pregunta" : "preguntas"}
                            </span>
                            {feedback.length > 0 && (
                              <span className="flex items-center gap-2 tabular-nums" aria-label={`${likes} me gustó, ${regular} regular, ${dislikes} no me gustó`}>
                                <span>😀 {likes}</span>
                                <span>😐 {regular}</span>
                                <span>😕 {dislikes}</span>
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFeedbackVideo(video)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e7e5e4] px-4 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                          >
                            <Smile size={15} aria-hidden="true" /> Opiniones
                            {feedback.length > 0 && (
                              <span className="rounded-full bg-[#f5f5f4] px-1.5 text-xs tabular-nums">{feedback.length}</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal(video)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#fff7ed] px-4 text-sm font-medium text-[#C2410C] transition-colors hover:bg-[#ffedd5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                          >
                            <MessageSquareText size={15} aria-hidden="true" /> Preguntas
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(video)}
                            aria-label={`Editar ${video.title}`}
                            title="Editar título y orden"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVideoToDelete(video)}
                            aria-label={`Eliminar ${video.title}`}
                            title="Eliminar clase"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* ── CONFIRMAR ELIMINAR CLASE ── */}
      <AnimatePresence>
        {videoToDelete && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-borrar-clase"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-red-700">
                <Trash2 size={22} aria-hidden="true" />
              </span>
              <h3 id="titulo-borrar-clase" className="mt-4 text-xl font-semibold tracking-[-0.01em]">¿Eliminar esta clase?</h3>
              <p className="mt-2 text-sm text-[#57534e]">
                Se borra <span className="font-medium text-[#0a0a0a]">“{videoToDelete.title}”</span> con todas sus preguntas. No se puede deshacer.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVideoToDelete(null)}
                  className="h-12 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(videoToDelete.id)}
                  className="h-12 rounded-full bg-red-700 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
