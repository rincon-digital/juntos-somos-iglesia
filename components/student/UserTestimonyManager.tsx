"use client";
import { useState, useEffect } from "react";
import {
  MessageSquareQuote,
  Send,
  Trash2,
  Loader2,
  Quote,
  X,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
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
      toast.success("¡Testimonio publicado con éxito! Gracias por compartir.");
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-10">
      {/* ENCABEZADO DE LA SECCIÓN */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-14 h-14 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center border border-[#FF6B00]/20">
          <MessageSquareQuote size={28} className="text-[#FF6B00]" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            Mi <span className="text-[#FF6B00]">Testimonio</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Comparte lo que Dios está haciendo en tu vida
          </p>
        </div>
      </div>

      {/* FORMULARIO PARA CREAR TESTIMONIO */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden group"
      >
        <Quote className="absolute -right-6 -bottom-6 text-white/[0.02] w-40 h-40 group-hover:scale-110 transition-transform duration-700" />

        <div className="relative z-10">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            Redactar Testimonio
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe aquí tu testimonio. ¿Cómo te ha impactado la palabra o la iglesia?..."
            className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-sm text-white/90 outline-none focus:border-[#FF6B00]/50 focus:bg-white/[0.02] transition-all min-h-[160px] resize-none leading-relaxed italic"
            maxLength={1000}
          />
          <div className="text-right mt-2 text-[10px] text-white/20 font-bold">
            {content.length} / 1000
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="relative z-10 w-full md:w-auto px-10 py-5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-[#FF6B00] hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
          {isSubmitting ? "Publicando..." : "Publicar Testimonio"}
        </button>
      </form>

      {/* LISTADO DE TESTIMONIOS PUBLICADOS POR EL ALUMNO */}
      {testimonies.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 border-b border-white/5 pb-4">
            Tus Testimonios Publicados
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {testimonies.map((testimonio) => (
                <motion.div
                  key={testimonio.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] group hover:border-[#FF6B00]/20 transition-colors"
                >
                  {editingId === testimonio.id ? (
                    <form
                      onSubmit={(e) => handleUpdate(e, testimonio.id)}
                      className="space-y-4 mb-6"
                    >
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-sm text-white/90 outline-none focus:border-[#FF6B00]/50 min-h-[120px] resize-none leading-relaxed italic"
                        maxLength={1000}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-[#FF6B00] rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#FF6B00]/80 transition-all flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            "Guardar"
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm md:text-base text-white/80 leading-relaxed italic mb-6">
                      "{testimonio.content}"
                    </p>
                  )}
                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">
                      {new Date(testimonio.createdAt).toLocaleDateString(
                        "es-AR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {editingId !== testimonio.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(testimonio.id);
                            setEditContent(testimonio.content);
                          }}
                          className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] transition-colors"
                          title="Editar testimonio"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(testimonio.id)}
                        disabled={
                          deletingId === testimonio.id ||
                          editingId === testimonio.id
                        }
                        className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        title="Eliminar testimonio"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR TESTIMONIO */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0d0d0d] border border-red-500/20 max-w-md w-full rounded-[3.5rem] p-12 text-center"
            >
              <AlertTriangle className="mx-auto mb-6 text-red-500" size={60} />
              <h2 className="text-3xl font-black uppercase italic mb-4 text-white">
                ¿Eliminar Testimonio?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(null)}
                  className="py-5 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={deletingId === showDeleteModal}
                  className="py-5 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingId === showDeleteModal ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : null}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
