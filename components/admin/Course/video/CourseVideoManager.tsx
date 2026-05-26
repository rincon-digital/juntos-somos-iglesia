"use client";
import { useState, useEffect } from "react";
import {
  Video,
  Plus,
  Youtube,
  AlertCircle,
  X,
  Info,
  Users,
  Play,
  BookOpen,
  BarChart2,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { getVideoErrorStats } from "@/actions/course/video/evaluations/evaluations.stats";
import {
  createCourseVideo,
  deleteVideo,
  updateVideo,
} from "@/actions/course/video/video";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import EvaluationForm from "../evaluation/EvaluationForm";

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* ── CABECERA ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f0f0f] border border-white/[0.07] px-6 py-5 rounded-2xl">
        <div>
          <h3 className="text-lg font-black uppercase text-white flex items-center gap-2.5 tracking-tight">
            <Video className="text-[#FF6B00]" size={20} />
            Clases del curso
          </h3>
          <p className="text-[11px] text-white/25 font-medium mt-0.5 flex items-center gap-1.5">
            <Info size={11} className="text-[#FF6B00]/60" />
            Añadí clases y configurá evaluaciones desde cada una.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingVideoId(null);
          }}
          className={`shrink-0 px-5 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wide transition-all flex items-center gap-2 ${
            showAddForm
              ? "bg-white/[0.06] border border-white/[0.08] text-white/60"
              : "bg-[#FF6B00] text-white hover:bg-orange-500"
          }`}
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          {showAddForm ? "Cancelar" : "Nueva clase"}
        </button>
      </div>

      {/* ── FORMULARIO NUEVA CLASE ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0f0f0f] border border-[#FF6B00]/20 p-6 rounded-2xl space-y-5"
          >
            <h4 className="text-sm font-black uppercase tracking-wide text-white">
              Nueva clase
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  Título de la lección
                </label>
                <input
                  type="text"
                  placeholder="Ej: El poder de la Oración"
                  value={newVideo.title}
                  onChange={(e) =>
                    setNewVideo({ ...newVideo, title: e.target.value })
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/40 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  URL de YouTube
                </label>
                <input
                  type="text"
                  placeholder="Pegá el link completo aquí"
                  value={newVideo.videoUrl}
                  onChange={(e) =>
                    setNewVideo({ ...newVideo, videoUrl: e.target.value })
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/40 transition-all"
                />
              </div>
            </div>

            {newVideo.videoUrl && getYouTubeThumbnail(newVideo.videoUrl) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <div className="relative overflow-hidden rounded-xl border border-white/[0.08] w-full max-w-xs">
                  <img
                    src={getYouTubeThumbnail(newVideo.videoUrl)!}
                    className="w-full aspect-video object-cover opacity-60"
                    alt="Miniatura YouTube"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Youtube className="text-red-500" size={32} />
                  </div>
                </div>
              </motion.div>
            )}

            <button
              onClick={handleSaveVideo}
              className="w-full bg-[#FF6B00] hover:bg-orange-500 text-white font-bold uppercase text-xs tracking-widest py-3.5 rounded-xl transition-all"
            >
              Publicar clase
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LISTA DE CLASES ── */}
      <div className="space-y-3">
        {videos.length === 0 && (
          <div className="py-16 text-center border border-dashed border-white/[0.07] rounded-2xl">
            <Video size={32} className="mx-auto text-white/10 mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest text-white/20">
              Sin clases aún
            </p>
            <p className="text-xs text-white/10 mt-1">
              Agregá la primera clase con el botón de arriba.
            </p>
          </div>
        )}

        {[...videos]
          .sort((a, b) => a.order - b.order)
          .map((video, idx) => {
            const videoStat = stats.find((s) => s.titulo === video.title);
            const isCritical = videoStat?.tasaError > 40;
            const thumbUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
            const approvalRate = 100 - (videoStat?.tasaError || 0);

            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-[#0f0f0f] border border-white/[0.07] hover:border-[#FF6B00]/30 rounded-2xl overflow-hidden transition-all"
              >
                {editingVideoId === video.id ? (
                  // ── FORMULARIO DE EDICIÓN INLINE ──
                  <div className="p-6 space-y-4 bg-white/[0.02]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest">
                          Editar Título
                        </label>
                        <input
                          type="text"
                          value={editVideoData.title}
                          onChange={(e) =>
                            setEditVideoData({
                              ...editVideoData,
                              title: e.target.value,
                            })
                          }
                          className="w-full bg-black/50 border border-white/[0.08] px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:border-[#FF6B00]/40 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest">
                          Editar Orden (Número)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editVideoData.order}
                          onChange={(e) =>
                            setEditVideoData({
                              ...editVideoData,
                              order: Number(e.target.value),
                            })
                          }
                          className="w-full bg-black/50 border border-white/[0.08] px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:border-[#FF6B00]/40 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => setEditingVideoId(null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-white/40 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleUpdateVideo(video.id)}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-black bg-[#FF6B00] hover:bg-orange-500 transition-all"
                      >
                        <Save size={14} /> Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── VISTA NORMAL (NO EDICIÓN) ──
                  <div className="flex items-center gap-4 p-4">
                    <div className="relative w-24 h-14 rounded-xl overflow-hidden border border-white/[0.08] shrink-0 hidden sm:block">
                      <img
                        src={thumbUrl}
                        className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                        alt="Miniatura"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={14} className="text-white/70" />
                      </div>
                    </div>

                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isCritical
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-white/[0.04] border-white/[0.08] text-white/30"
                      }`}
                    >
                      {video.order}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase text-white group-hover:text-[#FF6B00] transition-colors truncate">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        {isCritical ? (
                          <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                            <AlertCircle size={10} /> Error:{" "}
                            {videoStat.tasaError}%
                          </span>
                        ) : (
                          <span className="text-[12px] text-white/25 font-medium flex items-center gap-1">
                            <BarChart2 size={10} /> Aprobación: {approvalRate}%
                          </span>
                        )}
                        <span className="text-[16px] text-white/20 flex items-center gap-1">
                          <BookOpen size={16} />{" "}
                          {video.videoReview?.length || 0} pregunta
                          {video.videoReview?.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEditing(video)}
                        title="Editar título/orden"
                        className="p-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] text-white/40 hover:text-white rounded-xl transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setVideoToDelete(video)}
                        title="Eliminar clase"
                        className="p-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-red-500/20 hover:border-red-500/40 text-white/40 hover:text-red-400 rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => openModal(video)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] hover:bg-[#FF6B00] hover:border-[#FF6B00] hover:text-black text-white/40 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ml-2"
                      >
                        <span className="hidden sm:inline">Preguntas</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINAR ── */}
      <AnimatePresence>
        {videoToDelete && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#0f0f0f] border border-red-500/20 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Eliminar Clase
              </h3>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">
                ¿Estás seguro de que deseas eliminar{" "}
                <strong className="text-white">"{videoToDelete.title}"</strong>?
                <br />
                Esta acción también borrará todas sus evaluaciones y{" "}
                <strong className="text-red-400">no se puede deshacer</strong>.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVideoToDelete(null)}
                  className="flex-1 py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmDelete(videoToDelete.id)}
                  className="flex-1 py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DE PREGUNTAS ── */}
      <AnimatePresence>
        {modalVideo && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setModalVideo(null);
                setAddingQuestionTo(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="relative bg-[#0f0f0f] border border-white/[0.08] w-full max-w-3xl max-h-[88vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 hidden sm:block">
                    <img
                      src={`https://img.youtube.com/vi/${modalVideo.videoId}/mqdefault.jpg`}
                      className="w-full h-full object-cover opacity-60"
                      alt="Miniatura"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play size={10} className="text-white/70" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#FF6B00]/70 uppercase tracking-widest">
                      Clase {modalVideo.order}
                    </p>
                    <h3 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                      {modalVideo.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalVideo(null);
                    setAddingQuestionTo(null);
                  }}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 hover:bg-white/[0.08] hover:text-white transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {modalVideo.videoReview && modalVideo.videoReview.length > 0 ? (
                  <>
                    {modalVideo.videoReview.map(
                      (review: any, index: number) => (
                        <div
                          key={review.id || `temp-${index}`}
                          className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
                        >
                          <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
                            <span className="text-[10px] font-black text-[#FF6B00]/70 uppercase tracking-widest">
                              Pregunta {index + 1}
                            </span>
                          </div>
                          <div className="p-5">
                            {/* Le pasamos onSuccess por si edita la pregunta */}
                            <EvaluationForm
                              videoId={modalVideo.id}
                              initialData={review}
                              onSuccess={(data: any) =>
                                handleQuestionAdded(modalVideo.id, data)
                              }
                            />
                          </div>
                        </div>
                      ),
                    )}
                    {addingQuestionTo === modalVideo.id ? (
                      <div className="bg-[#FF6B00]/[0.04] border border-[#FF6B00]/20 rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#FF6B00]/10 flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#FF6B00]/70 uppercase tracking-widest">
                            Nueva pregunta
                          </span>
                          <button
                            onClick={() => setAddingQuestionTo(null)}
                            className="text-[10px] text-white/30 hover:text-red-400 font-bold uppercase tracking-wide transition-colors flex items-center gap-1"
                          >
                            <X size={11} /> Cancelar
                          </button>
                        </div>
                        <div className="p-5">
                          {/* ACÁ LE PASAMOS EL ONSUCCESS CUANDO AGREGA OTRA */}
                          <EvaluationForm
                            videoId={modalVideo.id}
                            onSuccess={(data: any) =>
                              handleQuestionAdded(modalVideo.id, data)
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingQuestionTo(modalVideo.id)}
                        className="w-full py-3.5 rounded-xl border border-dashed border-white/[0.08] text-white/30 text-[11px] font-bold uppercase tracking-widest hover:border-[#FF6B00]/40 hover:text-[#FF6B00] hover:bg-[#FF6B00]/[0.04] transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} /> Añadir otra pregunta
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.05]">
                      <span className="text-[10px] font-black text-[#FF6B00]/70 uppercase tracking-widest">
                        Primera pregunta
                      </span>
                    </div>
                    <div className="p-5">
                      {/* ACÁ LE PASAMOS EL ONSUCCESS EN LA PRIMERA */}
                      <EvaluationForm
                        videoId={modalVideo.id}
                        onSuccess={(data: any) =>
                          handleQuestionAdded(modalVideo.id, data)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
