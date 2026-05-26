"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Image as ImageIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createArticle } from "@/actions/articles/articles"; // Asegurate de que la ruta sea correcta
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

  const handleSave = async () => {
    if (!title.trim() || !content || content === "<p></p>") {
      toast.error("El título y contenido son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      data.append("title", title);
      data.append("content", content);
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
              {/* Preview de Imagen */}
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover opacity-40"
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

            {/* Columna Derecha: Editor de Contenido */}
            <div className="w-full md:w-7/12 h-[60vh] md:h-full flex flex-col bg-[#080808]">
              <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar">
                <div className="max-w-xl mx-auto space-y-8">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Escribe el contenido del testimonio o artículo aquí..."
                  />

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
