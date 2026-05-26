"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  GraduationCap,
  Users,
  Copy,
  AlertCircle,
  RefreshCw,
  X,
  Video,
  Trash2,
  Pencil,
  ShieldCheck,
  Globe,
  Loader2,
  Lock,
  User as UserIcon,
} from "lucide-react";
import {
  getInfoCourses,
  updateCodeCourse,
  deleteCourse,
  updateCourse,
  getCourses,
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
  const [activeTab, setActiveTab] = useState<"mis-cursos">("mis-cursos");
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

  // 🔥 ACÁ ESTÁ LA CORRECCIÓN DEL BUCLE INFINITO
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

  const filteredCourses = Array.isArray(courses)
    ? courses.filter((c) =>
        c?.name?.toLowerCase().includes(searchQuery?.toLowerCase() || ""),
      )
    : [];

  return (
    <div className="w-full space-y-8">
      <Toaster richColors theme="dark" />

      {/* CABECERA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
            {activeTab === "mis-cursos" ? (
              <ShieldCheck className="text-[#FF6B00]" size={24} />
            ) : (
              <Globe className="text-blue-400" size={24} />
            )}
            {activeTab === "mis-cursos" ? "Mis Programas" : "Catálogo Global"}
          </h2>
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
          ) : (
            filteredCourses.map((curso) => {
              const registered = curso._count?.courseRegistration || 0;
              const fillPercent = Math.min(
                100,
                Math.round((registered / (curso.quotaLimit || 1)) * 100),
              );
              const isReadOnly = false;

              return (
                <motion.div
                  layout
                  key={curso.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#0f0f0f] border border-white/[0.07] rounded-[2rem] overflow-hidden flex flex-col"
                >
                  <div className="p-7 space-y-6 flex-1">
                    <div className="flex justify-between">
                      <div className="w-12 h-12 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-2xl flex items-center justify-center">
                        <GraduationCap size={22} className="text-[#FF6B00]" />
                      </div>
                      {!isReadOnly && (
                        <div className="flex gap-1 border-l border-white/10 pl-3">
                          <button
                            onClick={() => openEditModal(curso)}
                            className="p-2 text-white/20 hover:text-white"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(curso)}
                            className="p-2 text-white/20 hover:text-red-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
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
                          className={`h-full ${isReadOnly ? "bg-white/10" : "bg-[#FF6B00]"}`}
                        />
                      </div>
                    </div>

                    {!isReadOnly && (
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
                  <div
                    className={`grid ${curso.isOwner ? "grid-cols-3" : "grid-cols-2"} border-t border-white/[0.05]`}
                  >
                    <button
                      disabled={isReadOnly}
                      onClick={() => {
                        setManagingCourse(curso);
                        setManagementType("students");
                      }}
                      className="py-5 text-[9px] font-black uppercase text-white/30 hover:bg-[#FF6B00] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Alumnos
                    </button>
                    <button
                      disabled={isReadOnly}
                      onClick={() => {
                        setManagingCourse(curso);
                        setManagementType("content");
                      }}
                      className="py-5 text-[9px] font-black uppercase text-white/30 border-l border-white/[0.05] hover:bg-[#FF6B00] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-transparent"
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

      {/* MODAL ELIMINACIÓN */}
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
              className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 text-center"
            >
              <Trash2 className="text-red-500 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-black uppercase text-white mb-2">
                Eliminar Curso
              </h3>
              <p className="text-sm text-white/40 mb-6">
                ¿Borrar "{courseToDelete.name}"?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCourseToDelete(null)}
                  className="flex-1 py-3 bg-white/5 text-white/40 hover:text-white rounded-xl font-bold uppercase text-[10px] transition-all"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] transition-all"
                >
                  Sí, eliminar
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
