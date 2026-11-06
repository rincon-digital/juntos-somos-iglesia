"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  GraduationCap,
  Users,
  Copy,
  RefreshCw,
  X,
  Video,
  Trash2,
  Pencil,
  ShieldCheck,
  Loader2,
  CalendarDays,
  PlayCircle,
} from "lucide-react";
import {
  getInfoCourses,
  updateCodeCourse,
  deleteCourse,
  updateCourse,
} from "@/actions/course/courses";
import { getCurrentUser } from "@/actions/auth/auth";
import { Role } from "@/lib/types/definitions";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import StudentPerformanceTable from "./students/StudentPerformanceTable";
import CourseCreate from "./CourseCreate";
import CourseVideoManager from "./video/CourseVideoManager";
import CourseCollaborators from "./CourseCollaborators";

const inputClass =
  "h-12 w-full rounded-xl border border-[#e7e5e4] bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] duration-200 hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30";

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-full text-[#57534e] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]";

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

// Estado del curso según sus fechas de apertura y cierre
function courseStatus(curso: any) {
  const now = Date.now();
  if (curso.openEnrollment && new Date(curso.openEnrollment).getTime() > now) {
    return { label: `Abre el ${formatDate(curso.openEnrollment)}`, cls: "bg-[#fffbeb] text-amber-800" };
  }
  if (new Date(curso.deadline).getTime() < now) {
    return { label: "Inscripción cerrada", cls: "bg-[#fef2f2] text-red-700" };
  }
  return { label: "Inscripción abierta", cls: "bg-[#ecfdf5] text-green-700" };
}

export default function CourseCommandCenter() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<Role | null>(null);

  const [managingCourse, setManagingCourse] = useState<any | null>(null);
  const [managementType, setManagementType] = useState<
    "students" | "content" | "collaborators" | null
  >(null);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<any | null>(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    quotaLimit: 0,
    deadline: "",
  });

  const fetchCourses = useCallback(async (updateActiveModal = true) => {
    setLoading(true);
    try {
      const res = await getInfoCourses(false);

      if (Array.isArray(res)) {
        setCourses(res);
        setManagingCourse((prev: any) => {
          if (updateActiveModal && prev) {
            const updated = res.find((c: any) => c.id === prev.id);
            return updated || prev;
          }
          return prev;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const session = await getCurrentUser();
      if (session && isMounted) setUserRole(session.role as Role);
      if (isMounted) await fetchCourses(true);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchCourses]);

  const handleRefreshCode = async (id: string) => {
    const toastId = toast.loading("Regenerando código...");
    const res = await updateCodeCourse(id);
    if (res && res.success) {
      toast.success("Código actualizado", { id: toastId });
      await fetchCourses(true);
    } else {
      toast.error("Error al actualizar", { id: toastId });
    }
  };

  const handleSaveEdit = async () => {
    if (!courseToEdit) return;
    const toastId = toast.loading("Guardando cambios...");
    const res = await updateCourse({
      id: courseToEdit.id,
      name: editFormData.name,
      quotaLimit: editFormData.quotaLimit,
      deadline: editFormData.deadline as any,
    } as any);

    if (res && res.success) {
      toast.success("Curso actualizado", { id: toastId });
      setCourseToEdit(null);
      await fetchCourses(false);
    } else {
      toast.error("Error al actualizar", { id: toastId });
    }
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    const toastId = toast.loading("Eliminando curso...");
    const res = await deleteCourse(courseToDelete.id);
    if (res && res.success) {
      toast.success("Curso eliminado", { id: toastId });
      setCourseToDelete(null);
      fetchCourses(false);
    } else {
      toast.error(res?.error || "Error al eliminar", { id: toastId });
    }
  };

  const openEditModal = (curso: any) => {
    setEditFormData({
      name: curso.name,
      quotaLimit: curso.quotaLimit,
      deadline: new Date(curso.deadline).toISOString().split("T")[0],
    });
    setCourseToEdit(curso);
  };

  const openManagement = (curso: any, type: "students" | "content" | "collaborators") => {
    setManagingCourse(curso);
    setManagementType(type);
  };

  const filteredCourses = Array.isArray(courses)
    ? courses.filter((c) =>
        c?.name?.toLowerCase().includes(searchQuery?.toLowerCase() || ""),
      )
    : [];

  return (
    <div className="w-full space-y-5 text-[#0a0a0a]">
      {/* BARRA DE HERRAMIENTAS */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <label htmlFor="buscar-curso" className="sr-only">
            Buscar curso
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]" size={16} aria-hidden="true" />
          <input
            id="buscar-curso"
            type="search"
            placeholder="Buscar curso…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClass} rounded-full pl-11`}
          />
        </div>
        <CourseCreate onSuccess={() => fetchCourses(false)} />
      </div>

      {/* LISTA DE CURSOS */}
      {loading && courses.length === 0 ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-[1.75rem] bg-[#f5f5f4]" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-[1.75rem] border border-[#e7e5e4] bg-white px-6 py-16 text-center">
          <p className="font-semibold">{searchQuery ? "No hay cursos con ese nombre" : "Todavía no tenés cursos"}</p>
          <p className="mt-1 text-sm text-[#57534e]">
            {searchQuery ? "Probá con otra palabra." : "Creá el primero con el botón “Crear curso”."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((curso) => {
              const registered = curso._count?.courseRegistration || 0;
              const fillPercent = Math.min(100, Math.round((registered / (curso.quotaLimit || 1)) * 100));
              const status = courseStatus(curso);
              const videos = curso.video?.length || 0;
              const collaborators = (curso.collaborators || []).map((c: any) => c.fullName);

              return (
                <motion.li
                  layout
                  key={curso.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-[1.75rem] border border-[#e7e5e4] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                >
                  <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-8">
                    {/* Nombre y responsables */}
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-[#C2410C]">
                        <GraduationCap size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-xl font-semibold capitalize tracking-[-0.01em]">{curso.name.toLowerCase()}</h3>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                        </div>
                        <p className="mt-1 truncate text-sm text-[#57534e]">
                          A cargo de {curso.creator || "Sistema"}
                          {collaborators.length > 0 && ` · con ${collaborators.join(", ")}`}
                        </p>
                        <p className="mt-2 flex items-center gap-4 text-sm text-[#57534e]">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={14} aria-hidden="true" /> Cierra el {formatDate(curso.deadline)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <PlayCircle size={14} aria-hidden="true" /> {videos} {videos === 1 ? "clase" : "clases"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Cupos */}
                    <div>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-[#57534e]">Inscritos</span>
                        <span className="font-medium tabular-nums">
                          {registered} de {curso.quotaLimit}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f5f5f4]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercent}%` }}
                          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                          className={`h-full rounded-full ${fillPercent >= 90 ? "bg-red-600" : "bg-[#FF6B00]"}`}
                        />
                      </div>
                    </div>

                    {/* Código de acceso */}
                    <div>
                      <p className="mb-1.5 text-sm text-[#57534e]">Código de acceso</p>
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-[#fafaf9] py-1 pl-4 pr-1">
                        <code className="text-base font-semibold tracking-[0.15em]">{curso.accessCode}</code>
                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(curso.accessCode);
                              toast.success("Código copiado");
                            }}
                            aria-label="Copiar código"
                            title="Copiar código"
                            className={`${iconButton} hover:bg-white hover:text-[#0a0a0a]`}
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRefreshCode(curso.id)}
                            aria-label="Generar un código nuevo"
                            title="Generar un código nuevo"
                            className={`${iconButton} hover:bg-white hover:text-[#C2410C]`}
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Editar / eliminar */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(curso)}
                        aria-label={`Editar ${curso.name}`}
                        title="Editar"
                        className={`${iconButton} hover:bg-[#f5f5f4] hover:text-[#0a0a0a]`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(curso)}
                        aria-label={`Eliminar ${curso.name}`}
                        title="Eliminar"
                        className={`${iconButton} hover:bg-[#fef2f2] hover:text-red-700`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Acciones de gestión */}
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e7e5e4] pt-5">
                    <button
                      type="button"
                      onClick={() => openManagement(curso, "students")}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                    >
                      <Users size={16} aria-hidden="true" /> Alumnos
                      <span className="rounded-full bg-white/15 px-2 text-xs tabular-nums">{registered}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openManagement(curso, "content")}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7e5e4] px-5 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                    >
                      <Video size={16} aria-hidden="true" /> Contenido y evaluaciones
                    </button>
                    {curso.isOwner && (
                      <button
                        type="button"
                        onClick={() => openManagement(curso, "collaborators")}
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7e5e4] px-5 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                      >
                        <ShieldCheck size={16} aria-hidden="true" /> Colaboradores
                      </button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <CourseManagementOverlay
        isOpen={!!managingCourse}
        onClose={() => {
          setManagingCourse(null);
          setManagementType(null);
          fetchCourses(false);
        }}
        course={managingCourse}
        type={managementType}
      />

      {/* MODAL EDICIÓN */}
      <AnimatePresence>
        {courseToEdit && (
          <div key="editar-curso" className="fixed inset-0 z-[7000] flex items-center justify-center p-4 font-[family-name:var(--font-poppins)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCourseToEdit(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-editar-curso"
              initial={{ scale: 0.98, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-lg rounded-[2rem] bg-white p-8 text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <h3 id="titulo-editar-curso" className="text-2xl font-semibold tracking-[-0.02em]">Editar curso</h3>
              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editar-nombre" className="text-sm font-medium text-[#292524]">Nombre</label>
                  <input
                    id="editar-nombre"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="editar-cupos" className="text-sm font-medium text-[#292524]">Cupos</label>
                    <input
                      id="editar-cupos"
                      type="number"
                      inputMode="numeric"
                      value={editFormData.quotaLimit}
                      onChange={(e) => setEditFormData({ ...editFormData, quotaLimit: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="editar-cierre" className="text-sm font-medium text-[#292524]">Cierre de inscripción</label>
                    <input
                      id="editar-cierre"
                      type="date"
                      value={editFormData.deadline}
                      onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCourseToEdit(null)}
                  className="h-12 flex-1 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="h-12 flex-1 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  Guardar cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINACIÓN */}
      <AnimatePresence>
        {courseToDelete && (
          <div key="borrar-curso" className="fixed inset-0 z-[7000] flex items-center justify-center p-4 font-[family-name:var(--font-poppins)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCourseToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-borrar-curso"
              initial={{ scale: 0.98, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 text-center text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-red-700">
                <Trash2 size={22} aria-hidden="true" />
              </span>
              <h3 id="titulo-borrar-curso" className="mt-4 text-xl font-semibold tracking-[-0.01em]">¿Eliminar este curso?</h3>
              <p className="mt-2 text-sm text-[#57534e]">
                Se borra <span className="font-medium capitalize text-[#0a0a0a]">{courseToDelete.name.toLowerCase()}</span> con todas sus inscripciones. No se puede deshacer.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCourseToDelete(null)}
                  className="h-12 flex-1 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="h-12 flex-1 rounded-full bg-red-700 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pantalla completa de gestión: sigue en oscuro porque sus componentes internos todavía son oscuros
function CourseManagementOverlay({ isOpen, onClose, course, type }: any) {
  const isStudents = type === "students";
  const isContent = type === "content";
  const isCollaborators = type === "collaborators";

  return (
    <AnimatePresence>
      {isOpen && course && type && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed inset-0 z-[6000] bg-[#050505] flex flex-col h-screen w-screen overflow-hidden"
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-[#FF6B00] rounded-xl flex items-center justify-center">
                {isStudents ? (
                  <Users className="text-white" size={24} />
                ) : isContent ? (
                  <Video className="text-white" size={24} />
                ) : (
                  <ShieldCheck className="text-white" size={24} />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic text-white">
                  {isStudents
                    ? "Alumnos"
                    : isContent
                      ? "Contenido"
                      : "Colaboradores"}
                </h2>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                  {course.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-12 h-12 bg-white/5 rounded-full text-white/40 hover:text-white flex items-center justify-center transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-7xl mx-auto w-full">
              {isStudents && (
                <StudentPerformanceTable
                  courseId={course.id}
                  students={course.courseRegistration || []}
                />
              )}
              {isContent && <CourseVideoManager course={course} />}
              {isCollaborators && (
                <CourseCollaborators
                  courseId={course.id}
                  initialManagers={course.managers || []}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
