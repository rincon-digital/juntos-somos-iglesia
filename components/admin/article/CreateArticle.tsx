"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Image as ImageIcon,
  Check,
  Loader2,
  Youtube,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createArticle } from "@/actions/articles/articles";
import {
  getYouTubeID,
  getYouTubeThumbnail,
} from "@/lib/helpers/article/validationArticle";
import RichTextEditor from "./RichTextEditor";
import Image from "next/image";

export default function CreateArticle({
  onRefresh,
}: {
  onRefresh: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del formulario
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [youtubeInput, setYoutubeInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddYoutubeUrl = () => {
    const cleanUrl = youtubeInput.trim();
    if (!cleanUrl) return;

    const videoId = getYouTubeID(cleanUrl);
    if (!videoId) {
      toast.error("Ingresa un enlace de YouTube válido.");
      return;
    }

    if (youtubeUrls.some((u) => getYouTubeID(u) === videoId)) {
      toast.error("Este video de YouTube ya fue añadido.");
      return;
    }

    setYoutubeUrls((prev) => [...prev, cleanUrl]);
    setYoutubeInput("");
  };

  const handleRemoveYoutubeUrl = (index: number) => {
    setYoutubeUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim() || !content || content === "<p></p>") {
      toast.error("El título y contenido son obligatorios.");
      return;
    }

    // Si dejó un enlace válido escrito en el input sin presionar "Añadir", lo incluimos
    const finalUrls = [...youtubeUrls];
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
      const data = new FormData();
      data.append("title", title);
      data.append("content", content);
      data.append("youtubeUrls", JSON.stringify(finalUrls));
      if (imageFile) {
        data.append("image", imageFile);
      }

      // Llamamos a tu Server Action con FormData
      const res = await createArticle(data);

      if (res.success) {
        toast.success("Artículo publicado correctamente.");
        setIsOpen(false);
        // Limpiamos el formulario
        setTitle("");
        setContent("");
        setImageFile(null);
        setImagePreview(null);
        setYoutubeUrls([]);
        setYoutubeInput("");
        onRefresh(); // Recargamos la lista
      } else {
        toast.error(res.error || "Error al publicar.");
      }
    } catch (error) {
      console.error("Error en el cliente al publicar:", error);
      toast.error("Error de conexión con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const fallbackYtThumb =
    youtubeUrls.length > 0
      ? getYouTubeThumbnail(youtubeUrls[0], "hqdefault")
      : youtubeInput.trim()
        ? getYouTubeThumbnail(youtubeInput.trim(), "hqdefault")
        : null;

  return (
    <>
      {/* BOTÓN NUEVO */}
      <button
        onClick={() => setIsOpen(true)}
        className="shrink-0 bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-orange-500 transition-all italic"
      >
        <Plus size={16} /> Nuevo
      </button>

      {/* MODAL DE CREACIÓN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-[#080808] flex flex-col md:flex-row overflow-hidden"
          >
            {/* Controles de cierre */}
            <div className="absolute top-6 right-6 z-[6000] flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Columna Izquierda: Imagen y Título */}
            <div className="w-full md:w-5/12 h-[40vh] md:h-full relative overflow-hidden bg-[#0a0a0a] flex flex-col justify-end">
              {/* Preview de Imagen o Miniatura de YouTube */}
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover opacity-40"
                />
              ) : fallbackYtThumb ? (
                <img
                  src={fallbackYtThumb}
                  alt="Miniatura de YouTube"
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                  <ImageIcon size={64} className="mb-4 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Sin imagen de portada
                  </p>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] md:bg-gradient-to-r md:from-transparent md:to-[#080808]" />

              {/* Botón para subir imagen */}
              <div className="absolute top-6 left-6 z-10">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/10 hover:bg-[#FF6B00] border border-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2"
                >
                  <ImageIcon size={14} />{" "}
                  {imagePreview ? "Cambiar Imagen" : "Subir Portada"}
                </button>
              </div>

              <div className="relative z-10 p-12 w-full">
                <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-[0.3em] mb-4">
                  Nuevo Artículo
                </p>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent border-b-2 border-[#FF6B00]/60 text-5xl font-black uppercase italic tracking-tighter text-white resize-none outline-none placeholder:text-white/20"
                  placeholder="Escribe un título..."
                />
              </div>
            </div>

            {/* Columna Derecha: Editor de Contenido + Enlaces de YouTube */}
            <div className="w-full md:w-7/12 h-[60vh] md:h-full flex flex-col bg-[#080808]">
              <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar">
                <div className="max-w-xl mx-auto space-y-8">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Escribe el contenido del testimonio o artículo aquí..."
                  />

                  {/* SECCIÓN DE ENLACES DE YOUTUBE (COMO EN LOS CURSOS) */}
                  <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Youtube size={16} className="text-[#FF6B00]" />
                        Videos de YouTube ({youtubeUrls.length})
                      </label>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                        Opcional • Múltiples enlaces
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Pegá el link de YouTube aquí (ej: https://youtu.be/...)"
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

                    {/* Preview en vivo mientras escribe */}
                    {youtubeInput.trim() &&
                      getYouTubeThumbnail(youtubeInput.trim(), "mqdefault") && (
                        <div className="p-3 bg-white/[0.02] border border-dashed border-[#FF6B00]/30 rounded-xl flex items-center gap-3">
                          <div className="relative w-24 aspect-video rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img
                              src={getYouTubeThumbnail(youtubeInput.trim(), "mqdefault")!}
                              alt="Preview YouTube"
                              className="w-full h-full object-cover opacity-70"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Youtube className="text-red-500" size={18} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">
                              Video detectado
                            </p>
                            <p className="text-xs text-white/50 truncate">
                              {youtubeInput.trim()}
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Lista de videos añadidos */}
                    {youtubeUrls.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {youtubeUrls.map((url, idx) => {
                          const thumb = getYouTubeThumbnail(url, "mqdefault");
                          return (
                            <div
                              key={`${url}-${idx}`}
                              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/40"
                            >
                              {thumb && (
                                <img
                                  src={thumb}
                                  alt={`YouTube ${idx + 1}`}
                                  className="w-full aspect-video object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Youtube className="text-red-500 drop-shadow-lg" size={28} />
                              </div>
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-black uppercase tracking-widest text-white/80">
                                Video {idx + 1}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveYoutubeUrl(idx)}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white/70 hover:text-white transition-colors"
                                title="Quitar video"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 py-5 bg-[#FF6B00] hover:bg-orange-500 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)]"
                    >
                      {isSaving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Publicar Artículo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
