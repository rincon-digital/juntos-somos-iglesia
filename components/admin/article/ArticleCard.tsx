"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, AlertTriangle, Loader2, X, Check, ExternalLink } from "lucide-react";
import { deleteArticle, updateArticle } from "@/actions/articles/articles";
import { toast } from "@/lib/toast";
import RichTextEditor, { editorStyles } from "./RichTextEditor";

function RichContent({ html }: { html: string }) {
  if (!html?.startsWith("<")) {
    return <p className="whitespace-pre-wrap text-lg leading-relaxed text-[#44403c]">{html}</p>;
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

const pillButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-[transform,background-color,border-color] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2";

export default function ArticleCard({ article, onRefresh }: ArticleCardProps) {
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editContent, setEditContent] = useState(article.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancelEdit = () => {
    setEditTitle(article.title);
    setEditContent(article.content);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent || editContent === "<p></p>") {
      toast.error("El título y contenido no pueden estar vacíos.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateArticle(article.id, {
        title: editTitle,
        content: editContent,
      });
      if (res.success) {
        toast.success("Artículo actualizado.");
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
    new Date(date).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Generar vista previa eliminando tags pero manteniendo espacios entre bloques
  const getPreviewText = (html: string) => {
    return html
      ?.replace(/<\/h1>|<\/h2>|<\/p>|<\/li>/g, " ")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  const openEditor = () => {
    setShowReadingModal(true);
    setIsEditing(true);
  };

  return (
    <>
      <style>{editorStyles}</style>

      {/* ── 1. TARJETA ── */}
      <motion.article
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#e7e5e4] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
      >
        <button
          type="button"
          onClick={() => setShowReadingModal(true)}
          className="flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF6B00]"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0a0a]">
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt=""
                fill
                sizes="(min-width: 1280px) 400px, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <img src="/Logo.webp" alt="" aria-hidden="true" className="absolute -bottom-10 -right-10 w-48 opacity-[0.12]" />
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="text-sm text-[#57534e]">
              {formatDate(article.createdAt)} · {article.author?.fullName || "Admin"}
            </p>
            <h3 className="mt-1 line-clamp-2 text-xl font-semibold tracking-[-0.01em]">{article.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-[#57534e]">{getPreviewText(article.content)}</p>
          </div>
        </button>
        <div className="flex items-center justify-between gap-2 border-t border-[#e7e5e4] px-5 py-3">
          <button
            type="button"
            onClick={openEditor}
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
          >
            <Pencil size={16} aria-hidden="true" /> Editar
          </button>
          <div className="flex gap-1">
            {article.slug && (
              <a
                href={`/articulos/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver en la web"
                title="Ver en la web"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              aria-label={`Eliminar ${article.title}`}
              title="Eliminar"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#fef2f2] hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </motion.article>

      {/* ── 2. LECTURA / EDICIÓN A PANTALLA COMPLETA ── */}
      <AnimatePresence>
        {showReadingModal && (
          <motion.div
            key="lectura-articulo"
            role="dialog"
            aria-modal="true"
            aria-label={article.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[5000] flex overflow-hidden bg-white text-[#0a0a0a] font-[family-name:var(--font-poppins)]"
          >
            {/* Imagen */}
            <div className="relative w-5/12 shrink-0 overflow-hidden bg-[#0a0a0a]">
              {article.imageUrl ? (
                <Image src={article.imageUrl} alt="" fill sizes="40vw" className="object-cover" />
              ) : (
                <img src="/Logo.webp" alt="" aria-hidden="true" className="absolute -bottom-16 -right-16 w-80 opacity-[0.12]" />
              )}
            </div>

            {/* Contenido */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-[#e7e5e4] px-10 py-5">
                <p className="text-sm text-[#57534e]">
                  {article.author?.fullName || "Admin"} · {formatDate(article.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={handleCancelEdit} className={`${pillButton} border border-[#e7e5e4] hover:bg-[#f5f5f4]`}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`${pillButton} bg-[#0a0a0a] text-white hover:bg-[#292524] disabled:cursor-wait disabled:opacity-80`}
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                        Guardar cambios
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setIsEditing(true)} className={`${pillButton} bg-[#0a0a0a] text-white hover:bg-[#292524]`}>
                        <Pencil size={16} aria-hidden="true" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(true)}
                        className={`${pillButton} border border-[#e7e5e4] text-red-700 hover:border-red-700 hover:bg-[#fef2f2]`}
                      >
                        <Trash2 size={16} aria-hidden="true" /> Eliminar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowReadingModal(false);
                      if (isEditing) handleCancelEdit();
                    }}
                    aria-label="Cerrar"
                    className="ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e] transition-colors hover:bg-[#e7e5e4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-10 py-10">
                <div className="mx-auto max-w-2xl">
                  {isEditing ? (
                    <>
                      <label htmlFor="editar-titulo" className="text-sm font-medium text-[#292524]">Título</label>
                      <textarea
                        id="editar-titulo"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        rows={2}
                        className="mt-1.5 w-full resize-none rounded-xl border border-[#e7e5e4] bg-white px-4 py-3 text-3xl font-semibold tracking-[-0.02em] outline-none transition-[border-color,box-shadow] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
                      />
                      <p className="mb-2 mt-6 text-sm font-medium text-[#292524]">Contenido</p>
                      <RichTextEditor value={editContent} onChange={setEditContent} placeholder="Contenido…" />
                    </>
                  ) : (
                    <>
                      <h2 className="mb-8 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-balance">{article.title}</h2>
                      <RichContent html={article.content} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. CONFIRMAR ELIMINACIÓN ── */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            key="borrar-articulo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm font-[family-name:var(--font-poppins)]"
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-borrar-articulo"
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-red-700">
                <AlertTriangle size={24} aria-hidden="true" />
              </span>
              <h3 id="titulo-borrar-articulo" className="mt-4 text-2xl font-semibold tracking-[-0.02em]">¿Eliminar el artículo?</h3>
              <p className="mt-2 text-sm text-[#57534e]">
                Se borran el texto y la imagen de “{article.title}”. No se puede deshacer.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowConfirmDelete(false)} className={`${pillButton} h-12 border border-[#e7e5e4] hover:bg-[#f5f5f4]`}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`${pillButton} h-12 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700 disabled:opacity-80`}
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
