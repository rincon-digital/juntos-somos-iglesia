"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createCourse } from "@/actions/course/courses";

interface CourseCreateProps {
  onSuccess?: () => void;
}

export default function CourseCreate({ onSuccess }: CourseCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quotaLimit: 0,
    openEnrollment: "",
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    const toastId = toast.loading("Creando curso...");

    try {
      const res = await createCourse({
        name: formData.name,
        description: formData.description,
        quotaLimit: Number(formData.quotaLimit),
        openEnrollment: formData.openEnrollment as any,
        deadline: formData.deadline as any,
        accessCode: "",
      });

      if (res && res.success) {
        toast.success("Curso creado exitosamente", { id: toastId });
        setIsOpen(false);
        setFormData({
          name: "",
          description: "",
          quotaLimit: 0,
          openEnrollment: "",
          deadline: "",
        });
        if (onSuccess) onSuccess();
      } else {
        if (res?.error && typeof res.error === "object") {
          setFieldErrors(res.error);
          toast.error("Revisa los datos del formulario", { id: toastId });
        } else {
          toast.error((res?.error as string) || "Error al crear el curso", { id: toastId });
        }
      }
    } catch (error) {
      toast.error("Error inesperado en el servidor", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* BOTÓN PARA ABRIR EL MODAL */}
      <button
        onClick={() => {
          setFieldErrors({});
          setIsOpen(true);
        }}
        className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#ff8533] text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
      >
        <Plus size={14} />
        Crear Curso
      </button>

      {/* MODAL DE CREACIÓN */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black uppercase italic text-white">
                  Nuevo <span className="text-[#FF6B00]">Curso</span>
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                    Nombre
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Liderazgo Avanzado"
                    className={`w-full bg-white/5 border ${fieldErrors.name ? "border-red-500/50" : "border-white/10"} rounded-xl py-3 px-4 text-white outline-none focus:border-[#FF6B00] text-sm`}
                  />
                  {fieldErrors.name && (
                    <p className="text-[10px] text-red-500 font-bold uppercase ml-2 mt-1 italic">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                    Descripción
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={5000}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Breve descripción del programa..."
                    className={`w-full bg-white/5 border ${fieldErrors.description ? "border-red-500/50" : "border-white/10"} rounded-xl py-3 px-4 text-white outline-none focus:border-[#FF6B00] text-sm resize-none`}
                  />
                  {fieldErrors.description && (
                    <p className="text-[10px] text-red-500 font-bold uppercase ml-2 mt-1 italic">
                      {fieldErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                      Cupos
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.quotaLimit || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quotaLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className={`w-full bg-white/5 border ${fieldErrors.quotaLimit ? "border-red-500/50" : "border-white/10"} rounded-xl py-3 px-4 text-white outline-none focus:border-[#FF6B00] text-sm`}
                    />
                    {fieldErrors.quotaLimit && (
                      <p className="text-[10px] text-red-500 font-bold uppercase ml-2 mt-1 italic">
                        {fieldErrors.quotaLimit}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                      Apertura
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.openEnrollment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openEnrollment: e.target.value,
                        })
                      }
                      className={`w-full bg-white/5 border ${fieldErrors.openEnrollment ? "border-red-500/50" : "border-white/10"} rounded-xl py-3 px-4 text-white outline-none focus:border-[#FF6B00] text-sm [color-scheme:dark]`}
                    />
                    {fieldErrors.openEnrollment && (
                      <p className="text-[10px] text-red-500 font-bold uppercase ml-2 mt-1 italic">
                        {fieldErrors.openEnrollment}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                      Cierre
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                      className={`w-full bg-white/5 border ${fieldErrors.deadline ? "border-red-500/50" : "border-white/10"} rounded-xl py-3 px-4 text-white outline-none focus:border-[#FF6B00] text-sm [color-scheme:dark]`}
                    />
                    {fieldErrors.deadline && (
                      <p className="text-[10px] text-red-500 font-bold uppercase ml-2 mt-1 italic">
                        {fieldErrors.deadline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] text-white/40 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] text-black bg-white hover:bg-[#FF6B00] hover:text-white transition-all flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Guardar Curso"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
