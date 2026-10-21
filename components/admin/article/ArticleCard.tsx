"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3,
  Trash2,
  Calendar,
  User as UserIcon,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  ArrowRight,
  Check,
  Youtube,
  Plus,
} from "lucide-react";
import { deleteArticle, updateArticle } from "@/actions/articles/articles";
import {
  getYouTubeID,
  getYouTubeThumbnail,
  parseArticleYouTubeUrls,
} from "@/lib/helpers/article/validationArticle";
import { toast } from "sonner";
import RichTextEditor, { editorStyles } from "./RichTextEditor";

function RichContent({ html }: { html: string }) {
  if (!html?.startsWith("<")) {
    return (
      <p className="text-white/65 text-lg md:text-xl leading-relaxed whitespace-pre-wrap italic font-light">
        {html}
      </p>
    );
  }

  return (
    <div className="tiptap-editor w-full overflow-hidden">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

interface ArticleCardProps {
  article: any;
  onRefresh: () => void;
}

export default function ArticleCard({ article, onRefresh }: ArticleCardProps) {
  const initialYoutubeUrls = parseArticleYouTubeUrls(article.youtubeUrls);

  const [showReadingModal, setShowReadingModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editContent, setEditContent] = useState(article.content);
  const [editYoutubeUrls, setEditYoutubeUrls] =
    useState<string[]>(initialYoutubeUrls);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancelEdit = () => {
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditYoutubeUrls(parseArticleYouTubeUrls(article.youtubeUrls));
    setYoutubeInput("");
    setIsEditing(false);
  };

  const handleAddYoutubeUrl = () => {
    const cleanUrl = youtubeInput.trim();
    if (!cleanUrl) return;

    const videoId = getYouTubeID(cleanUrl);
    if (!videoId) {
      toast.error("Ingresa un enlace de YouTube válido.");
      return;
    }

    if (editYoutubeUrls.some((u) => getYouTubeID(u) === videoId)) {
      toast.error("Este video ya está en la lista.");
      return;
    }

    setEditYoutubeUrls((prev) => [...prev, cleanUrl]);
    setYoutubeInput("");
  };

  const handleRemoveYoutubeUrl = (index: number) => {
    setEditYoutubeUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent || editContent === "<p></p>") {
      toast.error("El título y contenido no pueden estar vacíos.");
      return;
    }

    const finalUrls = [...editYoutubeUrls];
    if (youtubeInput.trim()) {
      const pendingId = getYouTubeID(youtubeInput.trim());
      if (!pendingId) {
        toast.error("El enlace de YouTube escrito no es válido.");
        return;
      }
      if (!finalUrls.some((u) => getYouTubeID(u) === pendingId)) {
        finalUrls.push(youtubeInput.trim());
      }
    }

    setIsSaving(true);
    try {
      const res = await updateArticle(article.id, {
        title: editTitle,
        content: editContent,
        youtubeUrls: finalUrls,
      });
      if (res.success) {
        toast.success("Artículo actualizado.");
        setYoutubeInput("");
        setIsEditing(false);
        onRefresh();
      } else {
        toast.error(res.error || "Error al guardar.");
      }
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteArticle(article.id);
      if (res.success) {
        toast.success(res.success);
        setShowConfirmDelete(false);
        setShowReadingModal(false);
        onRefresh();
      } else toast.error(res.error);
    } catch {
      toast.error("Error al eliminar.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Generar vista previa eliminando tags pero manteniendo espacios entre bloques
  const getPreviewText = (html: string) => {
    return html
      ?.replace(/<\/h1>|<\/h2>|<\/p>|<\/li>/g, " ") // Añade espacio al cerrar bloques
      .replace(/<[^>]*>/g, "") // Eliminar el resto de tags
      .trim();
  };

  const articleYoutubeUrls = parseArticleYouTubeUrls(article.youtubeUrls);
  const fallbackThumb =
    !article.imageUrl && articleYoutubeUrls.length > 0
      ? getYouTubeThumbnail(articleYoutubeUrls[0], "hqdefault")
      : null;

  return (
    <>
      {/* Inyectamos los estilos globales que definen los colores y tamaños de H1, H2 y Listas */}
      <style>{editorStyles}</style>

      {/* ── 1. CARD VISTA PREVIA ── */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowReadingModal(true)}
        className="group cursor-pointer bg-[#0a0a0a] border border-white/[0.05] rounded-[2.5rem] overflow-hidden flex flex-col hover:border-[#FF6B00]/30 transition-all duration-500 shadow-2xl"
      >
        <div className="relative h-52 w-full overflow-hidden">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover opacity-50 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
            />
          ) : fallbackThumb ? (
            <img
              src={fallbackThumb}
              alt={article.title}
              className="w-full h-full object-cover opacity-50 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
              <FileText size={48} className="text-white/[0.05]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />

          {articleYoutubeUrls.length > 0 && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white">
              <Youtube size={13} className="text-red-500" />
              {articleYoutubeUrls.length}{" "}
              {articleYoutubeUrls.length === 1 ? "Video" : "Videos"}
            </div>
          )}
        </div>

        <div className="p-8 flex-1 flex flex-col">
          <h3 className="text-xl font-black text-white uppercase italic mb-4 line-clamp-2 group-hover:text-[#FF6B00] transition-colors tracking-tighter">
            {article.title}
          </h3>
          <p className="text-xs text-white/40 leading-relaxed line-clamp-3 italic flex-1">
            {getPreviewText(article.content)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-[#FF6B00] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
            Leer artículo completo <ArrowRight size={10} />
          </div>
        </div>
      </motion.div>

      {/* ── 2. MODAL LECTURA A PANTALLA COMPLETA ── */}
      <AnimatePresence>
        {showReadingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-[#080808] flex flex-col md:flex-row overflow-hidden"
          >
            {/* Controles */}
            <div className="absolute top-6 right-6 z-[6000] flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setEditTitle(article.title);
                    setEditContent(article.content);
                    setEditYoutubeUrls(
                      parseArticleYouTubeUrls(article.youtubeUrls),
                    );
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-[#FF6B00] border border-white/10 rounded-full transition-all font-black uppercase text-[9px] text-white"
                >
                  <Edit3 size={14} /> Editar
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-full transition-all font-black uppercase text-[9px] text-white/60"
                >
                  <X size={14} /> Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  setShowReadingModal(false);
                  if (isEditing) handleCancelEdit();
                }}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Banner lateral */}
            <div className="w-full md:w-5/12 h-[40vh] md:h-full relative overflow-hidden bg-[#0a0a0a]">
              {article.imageUrl ? (
                <Image
                  src={article.imageUrl}
                  alt=""
                  fill
                  className="object-cover opacity-40"
                />
              ) : fallbackThumb ? (
                <img
                  src={fallbackThumb}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] md:bg-gradient-to-r md:from-transparent md:to-[#080808]" />
              <div className="absolute bottom-16 left-12 right-12 hidden md:block">
                <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-[0.3em] mb-4">
                  Artículo
                </p>
                {isEditing ? (
                  <textarea
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-b-2 border-[#FF6B00]/60 text-5xl font-black uppercase italic tracking-tighter text-white resize-none outline-none"
                    placeholder="Título..."
                  />
                ) : (
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
                    {article.title}
                  </h2>
                )}
              </div>
            </div>

            {/* Columna Derecha: Contenido con soporte para H1, H2, Listas y Videos de YouTube */}
            <div className="w-full md:w-7/12 h-[60vh] md:h-full flex flex-col bg-[#080808]">
              <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar">
                <div className="max-w-xl mx-auto space-y-12">
                  {/* Metadata */}
                  <div className="flex items-center gap-5 pb-10 border-b border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center">
                      <UserIcon size={22} className="text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#FF6B00] tracking-[0.3em]">
                        Escrito por
                      </p>
                      <p className="text-white text-lg font-black uppercase italic">
                        {article.author?.fullName || "Admin"}
                      </p>
                    </div>
                    <div className="ml-auto text-white/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} /> {formatDate(article.createdAt)}
                    </div>
                  </div>

                  {/* Renderizado de contenido dinámico */}
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-8"
                      >
                        <RichTextEditor
                          value={editContent}
                          onChange={setEditContent}
                          placeholder="Contenido..."
                        />

                        {/* Editor de enlaces de YouTube */}
                        <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                          <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Youtube size={16} className="text-[#FF6B00]" />
                            Videos de YouTube ({editYoutubeUrls.length})
                          </label>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Pegá el link de YouTube aquí"
                              value={youtubeInput}
                              onChange={(e) => setYoutubeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddYoutubeUrl();
                                }
                              }}
                              className="flex-1 bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-xl text-xs text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/40 transition-all"
                            />
                            <button
                              type="button"
                              onClick={handleAddYoutubeUrl}
                              className="px-4 py-3 bg-[#FF6B00]/10 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white border border-[#FF6B00]/30 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-1.5 shrink-0"
                            >
                              <Plus size={14} /> Añadir
                            </button>
                          </div>

                          {editYoutubeUrls.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              {editYoutubeUrls.map((url, idx) => {
                                const thumb = getYouTubeThumbnail(
                                  url,
                                  "mqdefault",
                                );
                                return (
                                  <div
                                    key={`${url}-${idx}`}
                                    className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/40"
                                  >
                                    {thumb && (
                                      <img
                                        src={thumb}
                                        alt={`YouTube ${idx + 1}`}
                                        className="w-full aspect-video object-cover opacity-60"
                                      />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <Youtube
                                        className="text-red-500"
                                        size={26}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveYoutubeUrl(idx)
                                      }
                                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white/70 hover:text-white transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="viewing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-10"
                      >
                        <RichContent html={article.content} />

                        {articleYoutubeUrls.length > 0 && (
                          <div className="space-y-6 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[#FF6B00]">
                              <Youtube size={18} />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                Videos Relacionados ({articleYoutubeUrls.length})
                              </span>
                            </div>
                            <div className="space-y-6">
                              {articleYoutubeUrls.map((url, idx) => {
                                const videoId = getYouTubeID(url);
                                if (!videoId) return null;
                                return (
                                  <div
                                    key={`${videoId}-${idx}`}
                                    className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl"
                                  >
                                    <iframe
                                      className="w-full h-full"
                                      src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                                      title={`${article.title} - Video ${idx + 1}`}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-20 pt-10 border-t border-white/5 grid grid-cols-2 gap-4 pb-12">
                    {isEditing ? (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="col-span-2 flex items-center justify-center gap-2 py-5 bg-[#FF6B00] rounded-2xl font-black uppercase text-[9px] text-white disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Guardar cambios
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirmDelete(true)}
                        className="flex items-center justify-center gap-2 py-5 bg-red-500/5 border border-red-500/10 hover:bg-red-600 rounded-2xl transition-all font-black uppercase text-[9px] text-red-500/50 hover:text-white"
                      >
                        <Trash2 size={14} /> Eliminar Artículo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. MODAL DE CONFIRMACIÓN PARA ELIMINAR ── */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-red-500/20 rounded-[3rem] p-10 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">
                ¿Eliminar Artículo?
              </h3>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-8 leading-relaxed">
                Esta acción borrará definitivamente el contenido y la imagen
                asociada. No se puede deshacer.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[9px] tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
