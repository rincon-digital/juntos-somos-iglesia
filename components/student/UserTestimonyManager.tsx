"use client";
import { useState, useEffect } from "react";
import { Send, Trash2, Loader2, AlertTriangle, Edit } from "lucide-react";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  createTestimony,
  deleteTestimony,
  getUserTestimony,
  updateTestimony,
} from "@/actions/testimony/testimony";

export default function UserTestimonyManager() {
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadTestimonies();
  }, []);

  const loadTestimonies = async () => {
    try {
      const data = await getUserTestimony();
      setTestimonies(data || []);
    } catch (error) {
      toast.error("Error al cargar tus testimonios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length < 10) {
      toast.error("El testimonio debe tener al menos 10 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newTestimony = await createTestimony(content);
      // Agregamos el nuevo testimonio al principio de la lista localmente
      setTestimonies([newTestimony, ...testimonies]);
      setContent("");
      toast.success("Testimonio publicado. ¡Gracias por compartir!");
    } catch (error) {
      toast.error("Hubo un error al publicar tu testimonio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTestimony(id);
      setTestimonies(testimonies.filter((t) => t.id !== id));
      toast.success("Testimonio eliminado");
      setShowDeleteModal(null);
    } catch (error) {
      toast.error("No se pudo eliminar el testimonio");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editContent.trim() || editContent.length < 10) {
      toast.error("El testimonio debe tener al menos 10 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateTestimony(id, editContent);
      setTestimonies(
        testimonies.map((t) =>
          t.id === id ? { ...t, content: updated.content } : t,
        ),
      );
      setEditingId(null);
      toast.success("Testimonio actualizado con éxito");
    } catch (error) {
      toast.error("Hubo un error al actualizar tu testimonio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const textareaClass =
    "w-full resize-none rounded-2xl border border-[#e7e5e4] bg-white p-4 text-[15px] leading-relaxed text-[#0a0a0a] outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30";
  const primaryButton =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

  if (isLoading) {
    return <div aria-busy="true" className="h-48 animate-pulse rounded-[1.75rem] bg-[#f5f5f4]" />;
  }

  return (
    <section aria-labelledby="mi-testimonio" className="w-full text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      <h2 id="mi-testimonio" className="text-xl font-semibold tracking-[-0.02em]">Mi testimonio</h2>
      <p className="mt-1 text-sm text-[#57534e]">Contá lo que Dios está haciendo en tu vida. Se publica en la web de la iglesia.</p>

      {/* NUEVO TESTIMONIO */}
      <form onSubmit={handleSubmit} className="mt-4 rounded-[1.75rem] border border-[#e7e5e4] bg-white p-5 md:p-6">
        <label htmlFor="nuevo-testimonio" className="sr-only">Tu testimonio</label>
        <textarea
          id="nuevo-testimonio"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="¿Cómo te impactó la Palabra o la iglesia?"
          rows={5}
          maxLength={1000}
          className={textareaClass}
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <span className={`text-xs tabular-nums ${content.length > 950 ? "text-[#C2410C]" : "text-[#a8a29e]"}`}>
            {content.length}/1000
          </span>
          <button type="submit" disabled={isSubmitting || content.trim().length < 10} className={primaryButton}>
            {isSubmitting ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
            {isSubmitting ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </form>

      {/* MIS TESTIMONIOS */}
      {testimonies.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-[#57534e]">
            Publicados <span className="tabular-nums">· {testimonies.length}</span>
          </h3>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {testimonies.map((testimonio) => (
                <motion.li
                  key={testimonio.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-[1.5rem] border border-[#e7e5e4] bg-white p-5"
                >
                  {editingId === testimonio.id ? (
                    <form onSubmit={(e) => handleUpdate(e, testimonio.id)} className="space-y-3">
                      <label htmlFor={`editar-${testimonio.id}`} className="sr-only">Editar testimonio</label>
                      <textarea
                        id={`editar-${testimonio.id}`}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        maxLength={1000}
                        className={textareaClass}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="h-11 rounded-full border border-[#e7e5e4] px-5 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                        >
                          Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className={primaryButton}>
                          {isSubmitting ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : "Guardar"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#44403c]">{testimonio.content}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <time dateTime={testimonio.createdAt} className="text-sm text-[#57534e]">
                      {new Date(testimonio.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                    {editingId !== testimonio.id && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(testimonio.id);
                            setEditContent(testimonio.content);
                          }}
                          aria-label="Editar testimonio"
                          title="Editar"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(testimonio.id)}
                          disabled={deletingId === testimonio.id}
                          aria-label="Eliminar testimonio"
                          title="Eliminar"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* CONFIRMAR ELIMINAR */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[6000] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-borrar-testimonio"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-sm rounded-t-[2rem] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:rounded-[2rem]"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-red-700">
                <AlertTriangle size={22} aria-hidden="true" />
              </span>
              <h3 id="titulo-borrar-testimonio" className="mt-4 text-xl font-semibold tracking-[-0.01em]">¿Eliminar este testimonio?</h3>
              <p className="mt-2 text-sm text-[#57534e]">Deja de verse en la web de la iglesia. No se puede deshacer.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(null)}
                  className="h-12 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={deletingId === showDeleteModal}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-red-700 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {deletingId === showDeleteModal && <Loader2 className="animate-spin" size={15} aria-hidden="true" />}
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
