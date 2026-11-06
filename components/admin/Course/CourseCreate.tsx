"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { createCourse } from "@/actions/course/courses";

interface CourseCreateProps {
  onSuccess?: () => void;
}

const fieldClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] duration-200 focus:ring-2 focus:ring-[#FF6B00]/30 ${
    hasError ? "border-red-600 focus:border-red-600" : "border-[#e7e5e4] hover:border-[#d6d3d1] focus:border-[#0a0a0a]"
  }`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-700">
      {message}
    </p>
  );
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
        type="button"
        onClick={() => {
          setFieldErrors({});
          setIsOpen(true);
        }}
        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
      >
        <Plus size={16} aria-hidden="true" />
        Crear curso
      </button>

      {/* MODAL DE CREACIÓN */}
      <AnimatePresence>
        {isOpen && (
          <div key="crear-curso" className="fixed inset-0 z-[8000] flex items-center justify-center p-4 font-[family-name:var(--font-poppins)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-crear-curso"
              initial={{ scale: 0.98, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[2rem] bg-white p-8 text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 id="titulo-crear-curso" className="text-2xl font-semibold tracking-[-0.02em]">Nuevo curso</h3>
                  <p className="mt-1 text-sm text-[#57534e]">El código de acceso se genera solo al crearlo.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e] transition-colors hover:bg-[#e7e5e4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="curso-nombre" className="text-sm font-medium text-[#292524]">Nombre</label>
                  <input
                    id="curso-nombre"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Liderazgo avanzado"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? "error-nombre" : undefined}
                    className={`${fieldClass(!!fieldErrors.name)} h-12`}
                  />
                  <FieldError id="error-nombre" message={fieldErrors.name} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="curso-descripcion" className="text-sm font-medium text-[#292524]">Descripción</label>
                  <textarea
                    id="curso-descripcion"
                    required
                    rows={3}
                    maxLength={5000}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descripción del programa…"
                    aria-invalid={!!fieldErrors.description}
                    aria-describedby={fieldErrors.description ? "error-descripcion" : undefined}
                    className={`${fieldClass(!!fieldErrors.description)} resize-none py-3`}
                  />
                  <FieldError id="error-descripcion" message={fieldErrors.description} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="curso-cupos" className="text-sm font-medium text-[#292524]">Cupos</label>
                    <input
                      id="curso-cupos"
                      required
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={formData.quotaLimit || ""}
                      onChange={(e) => setFormData({ ...formData, quotaLimit: parseInt(e.target.value) || 0 })}
                      aria-invalid={!!fieldErrors.quotaLimit}
                      aria-describedby={fieldErrors.quotaLimit ? "error-cupos" : undefined}
                      className={`${fieldClass(!!fieldErrors.quotaLimit)} h-12`}
                    />
                    <FieldError id="error-cupos" message={fieldErrors.quotaLimit} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="curso-apertura" className="text-sm font-medium text-[#292524]">Apertura</label>
                    <input
                      id="curso-apertura"
                      required
                      type="date"
                      value={formData.openEnrollment}
                      onChange={(e) => setFormData({ ...formData, openEnrollment: e.target.value })}
                      aria-invalid={!!fieldErrors.openEnrollment}
                      aria-describedby={fieldErrors.openEnrollment ? "error-apertura" : undefined}
                      className={`${fieldClass(!!fieldErrors.openEnrollment)} h-12`}
                    />
                    <FieldError id="error-apertura" message={fieldErrors.openEnrollment} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="curso-cierre" className="text-sm font-medium text-[#292524]">Cierre</label>
                    <input
                      id="curso-cierre"
                      required
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      aria-invalid={!!fieldErrors.deadline}
                      aria-describedby={fieldErrors.deadline ? "error-cierre" : undefined}
                      className={`${fieldClass(!!fieldErrors.deadline)} h-12`}
                    />
                    <FieldError id="error-cierre" message={fieldErrors.deadline} />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-12 flex-1 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Creando…
                      </>
                    ) : (
                      "Crear curso"
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
