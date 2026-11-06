"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Image as ImageIcon, Check, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { createArticle } from "@/actions/articles/articles";
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

      const res = await createArticle(data);

      if (res.success) {
        toast.success("Artículo publicado correctamente.");
        setIsOpen(false);
        setTitle("");
        setContent("");
        setImageFile(null);
        setImagePreview(null);
        onRefresh();
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
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
      >
        <Plus size={16} aria-hidden="true" /> Nuevo artículo
      </button>

      {/* PANTALLA DE CREACIÓN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nuevo-articulo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nuevo-articulo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[5000] flex overflow-hidden bg-white text-[#0a0a0a] font-[family-name:var(--font-poppins)]"
          >
            {/* Portada */}
            <div className="flex w-5/12 shrink-0 flex-col gap-4 border-r border-[#e7e5e4] bg-[#fafaf9] p-8">
              <p className="text-sm font-medium text-[#292524]">Imagen de portada</p>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-1 items-center justify-center overflow-hidden rounded-[1.75rem] border-2 border-dashed border-[#d6d3d1] bg-white transition-colors hover:border-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                {imagePreview ? (
                  <>
                    <Image src={imagePreview} alt="Vista previa de la portada" fill className="object-cover" />
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Cambiar imagen
                    </span>
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-3 text-[#57534e]">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f4]">
                      <ImageIcon size={22} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-[#0a0a0a]">Subir imagen</span>
                    <span className="text-sm">Opcional · se ve en la tarjeta y en la página</span>
                  </span>
                )}
              </button>
            </div>

            {/* Título y contenido */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-[#e7e5e4] px-10 py-5">
                <h2 id="titulo-nuevo-articulo" className="text-xl font-semibold tracking-[-0.01em]">Nuevo artículo</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                    {isSaving ? "Publicando…" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Cerrar"
                    className="ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e] transition-colors hover:bg-[#e7e5e4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-10 py-10">
                <div className="mx-auto max-w-2xl">
                  <label htmlFor="nuevo-titulo" className="text-sm font-medium text-[#292524]">Título</label>
                  <textarea
                    id="nuevo-titulo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    rows={2}
                    placeholder="Escribí un título…"
                    className="mt-1.5 w-full resize-none rounded-xl border border-[#e7e5e4] bg-white px-4 py-3 text-3xl font-semibold tracking-[-0.02em] outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
                  />
                  <p className="mb-2 mt-6 text-sm font-medium text-[#292524]">Contenido</p>
                  <RichTextEditor value={content} onChange={setContent} placeholder="Escribí el contenido del artículo…" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
