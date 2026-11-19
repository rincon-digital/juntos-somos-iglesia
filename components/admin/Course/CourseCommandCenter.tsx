"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
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

// Boleto: mismo ícono que usan los cupos en la portada
function CouponIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.46433 9.34375C2.21579 9.34375 1.98899 9.14229 2.00041 8.87895C2.06733 7.33687 2.25481 6.33298 2.78008 5.53884C3.08228 5.08196 3.45765 4.68459 3.88923 4.36468C5.05575 3.5 6.70139 3.5 9.99266 3.5H14.0074C17.2986 3.5 18.9443 3.5 20.1108 4.36468C20.5424 4.68459 20.9177 5.08196 21.2199 5.53884C21.7452 6.33289 21.9327 7.33665 21.9996 8.87843C22.011 9.14208 21.7839 9.34375 21.5351 9.34375C20.1493 9.34375 19.0259 10.533 19.0259 12C19.0259 13.467 20.1493 14.6562 21.5351 14.6562C21.7839 14.6562 22.011 14.8579 21.9996 15.1216C21.9327 16.6634 21.7452 17.6671 21.2199 18.4612C20.9177 18.918 20.5424 19.3154 20.1108 19.6353C18.9443 20.5 17.2986 20.5 14.0074 20.5H9.99266C6.70139 20.5 5.05575 20.5 3.88923 19.6353C3.45765 19.3154 3.08228 18.918 2.78008 18.4612C2.25481 17.667 2.06733 16.6631 2.00041 15.1211C1.98899 14.8577 2.21579 14.6562 2.46433 14.6562C3.85012 14.6562 4.97352 13.467 4.97352 12C4.97352 10.533 3.85012 9.34375 2.46433 9.34375Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

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

  // Desde "Para revisar" del dashboard llega ?curso=<id>: abre ese curso en Alumnos una sola vez
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (openedFromLink.current || courses.length === 0) return;
    const id = new URLSearchParams(window.location.search).get("curso");
    if (!id) return;
    const target = courses.find((c: any) => c.id === id);
    if (target) {
      openedFromLink.current = true;
      setManagingCourse(target);
      setManagementType("students");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [courses]);

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
      // Día local (en-CA da YYYY-MM-DD); toISOString lo corría un día
      deadline: new Date(curso.deadline).toLocaleDateString("en-CA"),
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
    <div className="flex w-full items-start gap-6 text-[#0a0a0a]">
      <div className="min-w-0 space-y-5">
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
        <ul className="-mx-2 flex max-h-[calc(100svh-14rem)] w-[calc(3*17.5rem+2rem+1rem)] flex-wrap content-start gap-x-4 gap-y-12 overflow-y-auto overscroll-contain px-2 pb-6 pt-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((curso) => {
              const registered = curso._count?.courseRegistration || 0;
              const isFull = registered >= (curso.quotaLimit || 0);
              const status = courseStatus(curso);

              return (
                <motion.li
                  layout
                  key={curso.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="relative flex w-[17.5rem] shrink-0 flex-col rounded-[1.5rem] rounded-tl-none border border-[#e7e5e4] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                >
                  {/* Estado: solapa pegada arriba, afuera de la tarjeta */}
                  <span
                    className={`absolute -left-px bottom-full rounded-t-xl border border-b-0 border-[#e7e5e4] px-3.5 pb-1 pt-1.5 text-xs font-medium ${status.cls}`}
                  >
                    {status.label}
                  </span>

                  {/* Nombre */}
                  <h3 title={curso.name} className="line-clamp-2 text-2xl font-semibold capitalize leading-tight tracking-[-0.02em]">
                    {curso.name.toLowerCase()}
                  </h3>

                  {/* Cupos y cierre */}
                  <dl className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[#fafaf9] px-3 py-2.5">
                      <dt className="flex items-center gap-1.5 text-xs text-[#57534e]">
                        <CouponIcon /> Cupos
                      </dt>
                      <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${isFull ? "text-red-600" : ""}`}>
                        {registered}/{curso.quotaLimit}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#fafaf9] px-3 py-2.5">
                      <dt className="flex items-center gap-1.5 text-xs text-[#57534e]">
                        <CalendarDays size={16} aria-hidden="true" /> Cierre
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold">
                        {new Date(curso.deadline).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      </dd>
                    </div>
                  </dl>

                  {/* Código de acceso */}
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[#fed7aa] bg-[#fff7ed] py-2 pl-4 pr-1.5">
                    <div>
                      <p className="text-xs text-[#9a3412]">Código de acceso</p>
                      <code className="font-mono text-2xl font-bold tracking-[0.2em] text-[#C2410C]">{curso.accessCode}</code>
                    </div>
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(curso.accessCode);
                          toast.success("Código copiado");
                        }}
                        aria-label="Copiar código"
                        title="Copiar código"
                        className={`${iconButton} !text-[#9a3412] hover:bg-white`}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRefreshCode(curso.id)}
                        aria-label="Generar un código nuevo"
                        title="Generar un código nuevo"
                        className={`${iconButton} !text-[#9a3412] hover:bg-white`}
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Acciones */}
                  <button
                    type="button"
                    onClick={() => openManagement(curso, "students")}
                    className="mt-4 h-11 w-full rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                  >
                    Ver curso
                  </button>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(curso)}
                      aria-label={`Editar ${curso.name}`}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-blue-50 text-sm font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <Pencil size={15} aria-hidden="true" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourseToDelete(curso)}
                      aria-label={`Eliminar ${curso.name}`}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-red-50 text-sm font-medium text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    >
                      <Trash2 size={15} aria-hidden="true" /> Eliminar
                    </button>
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
        onTabChange={setManagementType}
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

      {/* CREAR CURSO: fijo al costado de la lista */}
      <aside className="w-[23rem] shrink-0 pt-24">
        <CourseCreate onSuccess={() => fetchCourses(false)} />
      </aside>
    </div>
  );
}

// Modal "Ver curso": alumnos, contenido y colaboradores en pestañas
function CourseManagementOverlay({ isOpen, onClose, course, type, onTabChange }: any) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const tabs: { id: string; label: string; icon: any; count?: number }[] = course
    ? [
        { id: "students", label: "Alumnos", icon: Users, count: course._count?.courseRegistration || 0 },
        { id: "content", label: "Contenido", icon: Video },
        ...(course.isOwner ? [{ id: "collaborators", label: "Colaboradores", icon: ShieldCheck }] : []),
      ]
    : [];

  return (
    <AnimatePresence>
      {isOpen && course && type && (
        <div key="ver-curso" className="fixed inset-0 z-[6000] flex items-center justify-center p-6 font-[family-name:var(--font-poppins)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-ver-curso"
            initial={{ scale: 0.98, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex h-[min(88vh,56rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            {/* Encabezado y pestañas */}
            <header className="flex items-center justify-between gap-6 border-b border-[#e7e5e4] px-8 py-5">
              <div className="min-w-0">
                <p className="text-sm text-[#57534e]">Curso</p>
                <h2 id="titulo-ver-curso" className="truncate text-2xl font-semibold capitalize tracking-[-0.02em]">
                  {course.name.toLowerCase()}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div role="tablist" aria-label="Secciones del curso" className="flex gap-1 rounded-full bg-[#f5f5f4] p-1">
                  {tabs.map((t) => {
                    const active = type === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onTabChange(t.id)}
                        className={`relative inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                          active ? "text-white" : "text-[#57534e] hover:text-[#0a0a0a]"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="ver-curso-pestana"
                            className="absolute inset-0 rounded-full bg-[#0a0a0a]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                        <Icon size={15} className="relative" aria-hidden="true" />
                        <span className="relative">{t.label}</span>
                        {t.count !== undefined && (
                          <span className={`relative rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/15" : "bg-white"}`}>
                            {t.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            {/* Contenido de la pestaña (por ahora estos componentes siguen en oscuro) */}
            <div role="tabpanel" className="flex-1 overflow-y-auto p-8">
              {type === "students" && (
                <StudentPerformanceTable courseId={course.id} students={course.courseRegistration || []} />
              )}
              {type === "content" && <CourseVideoManager course={course} />}
              {type === "collaborators" && (
                <CourseCollaborators courseId={course.id} initialManagers={course.managers || []} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
