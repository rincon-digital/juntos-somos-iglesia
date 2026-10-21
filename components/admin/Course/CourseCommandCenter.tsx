"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  GraduationCap,
  Users,
  Copy,
  AlertTriangle,
  RefreshCw,
  X,
  Video,
  Trash2,
  Pencil,
  ShieldCheck,
  Globe,
  Loader2,
  Archive,
  RotateCcw,
  User as UserIcon,
} from "lucide-react";
import {
  getInfoCourses,
  updateCodeCourse,
  deleteCourse,
  restoreCourse,
  permanentDeleteCourse,
  updateCourse,
} from "@/actions/course/courses";
import { getCurrentUser } from "@/actions/auth/auth";
import { Role } from "@/lib/types/definitions";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import StudentPerformanceTable from "./students/StudentPerformanceTable";
import CourseCreate from "./CourseCreate";
import CourseVideoManager from "./video/CourseVideoManager";
import CourseCollaborators from "./CourseCollaborators";

export default function CourseCommandCenter() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"mis-cursos" | "global">("mis-cursos");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [userRole, setUserRole] = useState<Role | null>(null);

  const [managingCourse, setManagingCourse] = useState<any | null>(null);
  const [managementType, setManagementType] = useState<
    "students" | "content" | "collaborators" | null
  >(null);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [courseToPermanentDelete, setCourseToPermanentDelete] = useState<any | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<any | null>(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    quotaLimit: 0,
    deadline: "",
  });

  const fetchCourses = useCallback(
    async (updateActiveModal = true, filterAll = activeTab === "global") => {
      setLoading(true);
      try {
        const res = await getInfoCourses(filterAll);

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
    },
    [activeTab],
  );

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const session = await getCurrentUser();
      if (session && isMounted) setUserRole(session.role as Role);
      if (isMounted) await fetchCourses(true, activeTab === "global");
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [activeTab, fetchCourses]);

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

  // Baja lógica
  const handleConfirmSoftDelete = async () => {
    if (!courseToDelete) return;
    const toastId = toast.loading("Dando de baja el curso...");
    const res = await deleteCourse(courseToDelete.id);
    if (res && res.success) {
      toast.success(res.success, { id: toastId });
      setCourseToDelete(null);
      fetchCourses(false);
    } else {
      toast.error(res?.error || "Error al dar de baja el curso", { id: toastId });
    }
  };

  // Restaurar curso
  const handleRestoreCourse = async (course: any) => {
    const toastId = toast.loading(`Restaurando "${course.name}"...`);
    const res = await restoreCourse(course.id);
    if (res && res.success) {
      toast.success(res.success, { id: toastId });
      fetchCourses(false);
    } else {
      toast.error(res?.error || "Error al restaurar el curso", { id: toastId });
    }
  };

  // Eliminación definitiva
  const handleConfirmPermanentDelete = async () => {
    if (!courseToPermanentDelete) return;
    const toastId = toast.loading("Eliminando curso definitivamente...");
    const res = await permanentDeleteCourse(courseToPermanentDelete.id);
    if (res && res.success) {
      toast.success(res.success, { id: toastId });
      setCourseToPermanentDelete(null);
      fetchCourses(false);
    } else {
      toast.error(res?.error || "Error al eliminar definitivamente", {
        id: toastId,
      });
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

  const activeCount = Array.isArray(courses)
    ? courses.filter((c) => c?.isActive !== false).length
    : 0;
  const inactiveCount = Array.isArray(courses)
    ? courses.filter((c) => c?.isActive === false).length
    : 0;

  const filteredCourses = Array.isArray(courses)
    ? courses.filter((c) => {
        const matchesStatus =
          statusFilter === "active"
            ? c?.isActive !== false
            : c?.isActive === false;
        const matchesSearch = c?.name
          ?.toLowerCase()
          .includes(searchQuery?.toLowerCase() || "");
        return matchesStatus && matchesSearch;
      })
    : [];

  return (
    <div className="w-full space-y-8">
      <Toaster richColors theme="dark" />

      {/* CABECERA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
            {statusFilter === "inactive" ? (
              <Archive className="text-amber-500" size={24} />
            ) : activeTab === "mis-cursos" ? (
              <ShieldCheck className="text-[#FF6B00]" size={24} />
            ) : (
              <Globe className="text-blue-400" size={24} />
            )}
            {statusFilter === "inactive"
              ? "Cursos Dados de Baja"
              : activeTab === "mis-cursos"
                ? "Mis Programas"
                : "Catálogo Global"}
          </h2>

          {/* Selector Activos / Dados de Baja */}
          <div className="flex items-center bg-[#0f0f0f] border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                statusFilter === "active"
                  ? "bg-[#FF6B00] text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Activos
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] ${
                  statusFilter === "active"
                    ? "bg-black/20 text-black"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                statusFilter === "inactive"
                  ? "bg-amber-500 text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Archive size={12} />
              Dados de Baja
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] ${
                  statusFilter === "inactive"
                    ? "bg-black/20 text-black"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {inactiveCount}
              </span>
            </button>
          </div>

          {userRole === Role.superadmin && (
            <div className="flex items-center bg-[#0f0f0f] border border-white/[0.08] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("mis-cursos")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "mis-cursos"
                    ? "bg-white/10 text-white"
                    : "text-white/30 hover:text-white"
                }`}
              >
                Mis Cursos
              </button>
              <button
                onClick={() => setActiveTab("global")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "global"
                    ? "bg-white/10 text-white"
                    : "text-white/30 hover:text-white"
                }`}
              >
                Todos
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-64 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
              size={14}
            />
            <input
              type="text"
              placeholder="FILTRAR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/[0.08] rounded-xl py-2.5 pl-11 text-[10px] text-white outline-none"
            />
          </div>
          <CourseCreate onSuccess={() => fetchCourses(false)} />
        </div>
      </div>

      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {loading && courses.length === 0 ? (
            <div className="col-span-full py-32 flex justify-center">
              <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-white/5 bg-white/[0.01] rounded-[2rem] space-y-3">
              {statusFilter === "inactive" ? (
                <>
                  <Archive className="mx-auto text-white/20" size={36} />
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">
                    No hay cursos dados de baja
                  </p>
                  <p className="text-[11px] text-white/20">
                    Los cursos que des de baja aparecerán aquí para que puedas restaurarlos o eliminarlos definitivamente.
                  </p>
                </>
              ) : (
                <>
                  <GraduationCap className="mx-auto text-white/20" size={36} />
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">
                    No se encontraron cursos activos
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredCourses.map((curso) => {
              const registered = curso._count?.courseRegistration || 0;
              const fillPercent = Math.min(
                100,
                Math.round((registered / (curso.quotaLimit || 1)) * 100),
              );
              const isInactive = curso.isActive === false;
              const canDeleteOrRestore =
                curso.isOwner || userRole === Role.superadmin;

              return (
                <motion.div
                  layout
                  key={curso.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`bg-[#0f0f0f] border rounded-[2rem] overflow-hidden flex flex-col ${
                    isInactive
                      ? "border-amber-500/20 opacity-90"
                      : "border-white/[0.07]"
                  }`}
                >
                  <div className="p-7 space-y-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                            isInactive
                              ? "bg-amber-500/10 border-amber-500/20"
                              : "bg-[#FF6B00]/10 border-[#FF6B00]/20"
                          }`}
                        >
                          {isInactive ? (
                            <Archive size={22} className="text-amber-500" />
                          ) : (
                            <GraduationCap
                              size={22}
                              className="text-[#FF6B00]"
                            />
                          )}
                        </div>
                        {isInactive && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                            Dado de Baja
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 border-l border-white/10 pl-3">
                        {!isInactive ? (
                          <>
                            <button
                              onClick={() => openEditModal(curso)}
                              className="p-2 text-white/20 hover:text-white transition-colors"
                              title="Editar curso"
                            >
                              <Pencil size={15} />
                            </button>
                            {canDeleteOrRestore && (
                              <button
                                onClick={() => setCourseToDelete(curso)}
                                className="p-2 text-white/20 hover:text-amber-400 transition-colors"
                                title="Dar de baja lógica"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
                        ) : (
                          canDeleteOrRestore && (
                            <>
                              <button
                                onClick={() => handleRestoreCourse(curso)}
                                className="p-2 text-emerald-400/70 hover:text-emerald-400 transition-colors"
                                title="Restaurar curso (Dar de alta)"
                              >
                                <RotateCcw size={15} />
                              </button>
                              <button
                                onClick={() => setCourseToPermanentDelete(curso)}
                                className="p-2 text-red-400/70 hover:text-red-500 transition-colors"
                                title="Eliminar definitivamente"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-black uppercase text-white line-clamp-2">
                        {curso.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2">
                        <UserIcon size={12} className="text-[#FF6B00]/60" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                          Encargado:{" "}
                          <span className="text-white/80">
                            {curso.creator || "Sistema"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-white/20">
                        <span>Ocupación</span>
                        <span>
                          {registered} / {curso.quotaLimit}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercent}%` }}
                          className={`h-full ${
                            isInactive ? "bg-amber-500/40" : "bg-[#FF6B00]"
                          }`}
                        />
                      </div>
                    </div>

                    {!isInactive && (
                      <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl">
                        <code className="text-[11px] font-black text-[#FF6B00]">
                          {curso.accessCode}
                        </code>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(curso.accessCode);
                              toast.success("Copiado");
                            }}
                            className="text-white/20 hover:text-white"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => handleRefreshCode(curso.id)}
                            className="text-white/20 hover:text-[#FF6B00]"
                          >
                            <RefreshCw size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isInactive ? (
                    <div
                      className={`grid ${curso.isOwner ? "grid-cols-3" : "grid-cols-2"} border-t border-white/[0.05]`}
                    >
                      <button
                        onClick={() => {
                          setManagingCourse(curso);
                          setManagementType("students");
                        }}
                        className="py-5 text-[9px] font-black uppercase text-white/30 hover:bg-[#FF6B00] hover:text-white transition-all"
                      >
                        Alumnos
                      </button>
                      <button
                        onClick={() => {
                          setManagingCourse(curso);
                          setManagementType("content");
                        }}
                        className="py-5 text-[9px] font-black uppercase text-white/30 border-l border-white/[0.05] hover:bg-[#FF6B00] hover:text-white transition-all"
                      >
                        Contenido
                      </button>
                      {curso.isOwner && (
                        <button
                          onClick={() => {
                            setManagingCourse(curso);
                            setManagementType("collaborators");
                          }}
                          className="py-5 text-[9px] font-black uppercase text-white/30 border-l border-white/[0.05] hover:bg-[#FF6B00] hover:text-white transition-all"
                        >
                          Colab.
                        </button>
                      )}
                    </div>
                  ) : (
                    canDeleteOrRestore && (
                      <div className="grid grid-cols-2 border-t border-white/[0.05]">
                        <button
                          onClick={() => handleRestoreCourse(curso)}
                          className="py-5 text-[9px] font-black uppercase text-emerald-400/80 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw size={12} />
                          Restaurar
                        </button>
                        <button
                          onClick={() => setCourseToPermanentDelete(curso)}
                          className="py-5 text-[9px] font-black uppercase text-red-400/80 border-l border-white/[0.05] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          Eliminar Totalmente
                        </button>
                      </div>
                    )
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

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
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCourseToEdit(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase italic text-white mb-6">
                Editar <span className="text-[#FF6B00]">Curso</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                    Nombre
                  </label>
                  <input
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                      Cupos
                    </label>
                    <input
                      type="number"
                      value={editFormData.quotaLimit}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          quotaLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase ml-2">
                      Cierre
                    </label>
                    <input
                      type="date"
                      value={editFormData.deadline}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          deadline: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setCourseToEdit(null)}
                  className="flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] text-white/40 bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] text-black bg-white hover:bg-[#FF6B00] hover:text-white transition-all"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL BAJA LÓGICA */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCourseToDelete(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="text-amber-500" size={30} />
              </div>
              <h3 className="text-xl font-black uppercase text-white mb-2">
                Dar de Baja Curso
              </h3>
              <p className="text-xs text-white/50 mb-6 leading-relaxed">
                ¿Deseas dar de baja{" "}
                <span className="text-white font-bold">
                  &ldquo;{courseToDelete.name}&rdquo;
                </span>
                ? Se ocultará del catálogo público y del panel de los alumnos inscritos, pero sus datos se conservarán en la sección{" "}
                <span className="text-amber-400 font-bold">Dados de Baja</span>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCourseToDelete(null)}
                  className="flex-1 py-3.5 bg-white/5 text-white/40 hover:text-white rounded-xl font-bold uppercase text-[10px] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSoftDelete}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black uppercase text-[10px] transition-all"
                >
                  Sí, dar de baja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINACIÓN DEFINITIVA */}
      <AnimatePresence>
        {courseToPermanentDelete && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCourseToPermanentDelete(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#0a0a0a] border border-red-500/20 w-full max-w-md rounded-[2.5rem] p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-500" size={30} />
              </div>
              <h3 className="text-xl font-black uppercase text-white mb-2">
                Eliminar Definitivamente
              </h3>
              <p className="text-xs text-white/50 mb-6 leading-relaxed">
                ¿Estás seguro de eliminar por completo{" "}
                <span className="text-white font-bold">
                  &ldquo;{courseToPermanentDelete.name}&rdquo;
                </span>
                ? Se borrarán permanentemente sus videos, evaluaciones e inscripciones de alumnos.{" "}
                <span className="text-red-400 font-bold">
                  Esta acción no se puede deshacer.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCourseToPermanentDelete(null)}
                  className="flex-1 py-3.5 bg-white/5 text-white/40 hover:text-white rounded-xl font-bold uppercase text-[10px] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPermanentDelete}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-[10px] transition-all"
                >
                  Eliminar para siempre
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
