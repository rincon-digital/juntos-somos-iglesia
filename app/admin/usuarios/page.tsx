"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Users,
  UserCog,
  BookOpen,
  Video,
  UsersIcon,
  X,
  ChevronRight,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Loader2,
  Info,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/auth";
import {
  getAdmins,
  getAdminCourses,
  deleteAdmin,
  getCourseCollaborators,
} from "@/actions/admin/dashboard";
import { Role } from "@/lib/types/definitions";
import { toast, Toaster } from "sonner";

// --- Animaciones Corregidas para TypeScript ---
const containerVars: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVars: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const drawerVars: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
    },
  },
  exit: {
    x: "100%",
    transition: {
      ease: "easeInOut",
      duration: 0.3,
    },
  },
};

// --- Componentes ---

function CourseCard({
  course,
  index,
  onSelect,
}: {
  course: any;
  index: number;
  onSelect: (c: any) => void;
}) {
  const fillPercent = Math.min(
    (course.studentCount / course.quotaLimit) * 100,
    100,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-[#0f0f0f] rounded-2xl p-5 cursor-pointer border border-white/5 hover:border-[#FF6B00]/30 transition-all relative overflow-hidden"
      onClick={() => onSelect(course)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <BookOpen className="text-[#FF6B00]" size={20} />
        </div>
        <div className="px-2 py-1 rounded-full text-[8px] font-bold uppercase bg-green-500/20 text-green-400">
          Activo
        </div>
      </div>

      <h4 className="text-sm font-bold text-white mb-4 group-hover:text-[#FF6B00] transition-colors uppercase tracking-tight">
        {course.name}
      </h4>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-[10px] mb-2 font-mono uppercase tracking-widest text-white/40">
            <span>Ocupación</span>
            <span className="text-white font-bold">
              {course.studentCount}/{course.quotaLimit}
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              className={`h-full ${fillPercent >= 90 ? "bg-red-500" : "bg-[#FF6B00]"}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-bold text-white/30 uppercase">
          <div className="flex items-center gap-1.5">
            <UsersIcon size={12} /> {course.studentCount} Alumnos
          </div>
          <div className="flex items-center gap-1.5">
            <Video size={12} /> {course.quotaLimit} Cupos
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [adminCourses, setAdminCourses] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loadingColabs, setLoadingColabs] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const [session, adminsData] = await Promise.all([
        getCurrentUser(),
        getAdmins(),
      ]);
      if (session?.role === Role.superadmin) {
        setAdmins(adminsData);
      } else {
        router.push("/admin");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAdmin = async (admin: any) => {
    setSelectedAdmin(admin);
    setSelectedCourse(null);
    try {
      const data = await getAdminCourses(admin.id);
      setAdminCourses(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenDetails = async (course: any) => {
    setSelectedCourse(course);
    setLoadingColabs(true);
    try {
      const colabs = await getCourseCollaborators(course.id);
      const filteredColabs = colabs.filter(
        (c: any) => c.id !== selectedAdmin?.id,
      );
      setCollaborators(filteredColabs);
    } catch (error) {
      toast.error("Error al cargar detalles");
    } finally {
      setLoadingColabs(false);
    }
  };

  // --- FUNCIÓN CORREGIDA Y VERIFICADA ---
  const handleDeleteAdminAction = async () => {
    if (!selectedAdmin) return;
    try {
      await deleteAdmin(selectedAdmin.id);
      toast.success("Administrador eliminado");
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      setAdminCourses(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
      </div>
    );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="bg-[#050505] min-h-screen p-4 md:p-8 overflow-x-hidden"
    >
      <Toaster position="bottom-right" richColors theme="dark" />

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        {/* COLUMNA IZQUIERDA: ADMINS */}
        <motion.div variants={itemVars} className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push("/admin")}
              className="p-3 bg-white/5 rounded-xl hover:bg-[#FF6B00] transition-colors group"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              Gestión <span className="text-[#FF6B00]">Staff</span>
            </h1>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {admins.map((admin) => (
              <div
                key={admin.id}
                onClick={() => handleSelectAdmin(admin)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all ${selectedAdmin?.id === admin.id ? "bg-[#FF6B00]/10 border-[#FF6B00]" : "bg-[#0f0f0f] border-white/5 hover:border-white/20"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-[#FF6B00]">
                    {admin.fullName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white uppercase tracking-tight">
                      {admin.fullName}
                    </p>
                    <p className="text-[10px] text-white/30 font-mono italic">
                      @{admin.username}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className={
                      selectedAdmin?.id === admin.id
                        ? "text-[#FF6B00]"
                        : "text-white/10"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* COLUMNA DERECHA */}
        <motion.div variants={itemVars} className="lg:col-span-8">
          {selectedAdmin && adminCourses ? (
            <div className="space-y-8">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/20">
                      <UserCog className="text-[#FF6B00]" size={40} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        {selectedAdmin.fullName}
                      </h2>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] font-mono text-[#FF6B00] uppercase bg-[#FF6B00]/10 px-2 py-0.5 rounded-md">
                          Admin
                        </span>
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          @{selectedAdmin.username}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-fit px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Eliminar Cuenta
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-mono text-[#FF6B00] uppercase tracking-[0.3em] mb-4">
                    Cursos Propios ({adminCourses.created.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {adminCourses.created.map((c: any, i: number) => (
                      <CourseCard
                        key={c.id}
                        course={c}
                        index={i}
                        onSelect={handleOpenDetails}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-4">
                    Colaboraciones ({adminCourses.collaborating.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-4 opacity-70">
                    {adminCourses.collaborating.map((c: any, i: number) => (
                      <CourseCard
                        key={c.id}
                        course={c}
                        index={i}
                        onSelect={handleOpenDetails}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center bg-[#0a0a0a] rounded-[2.5rem] border border-dashed border-white/5 p-10">
              <Users className="text-white/5 mb-4" size={60} />
              <p className="text-white/20 font-mono text-[11px] uppercase tracking-[0.3em]">
                Selecciona un administrador para auditar
              </p>
            </div>
          )}
        </motion.div>

        {/* DRAWER LATERAL */}
        <AnimatePresence>
          {selectedCourse && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={() => setSelectedCourse(null)}
              />
              <motion.div
                variants={drawerVars}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed top-0 right-0 h-screen w-full max-w-[400px] bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl p-8 flex flex-col"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                    Detalles del <span className="text-[#FF6B00]">Curso</span>
                  </h3>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8 flex-1">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">
                      Curso seleccionado
                    </p>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      {selectedCourse.name}
                    </h2>
                    <div className="flex items-center gap-3 p-3 bg-[#FF6B00]/5 rounded-2xl border border-[#FF6B00]/10">
                      <UserCheck size={18} className="text-[#FF6B00]" />
                      <div>
                        <p className="text-[9px] font-mono text-[#FF6B00] uppercase">
                          Creador Principal
                        </p>
                        <p className="text-sm font-bold text-white">
                          {selectedAdmin?.fullName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Users size={14} /> Colaboradores ({collaborators.length})
                    </h4>

                    <div className="space-y-4">
                      {loadingColabs ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="animate-spin text-[#FF6B00]" />
                        </div>
                      ) : collaborators.length > 0 ? (
                        collaborators.map((colab) => (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={colab.id}
                            className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40 uppercase">
                              {colab.fullName[0]}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-white uppercase">
                                {colab.fullName}
                              </p>
                              <p className="text-[9px] text-white/30 font-mono tracking-tighter">
                                @{colab.username}
                              </p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl">
                          <Info
                            className="mx-auto mb-2 text-white/10"
                            size={20}
                          />
                          <p className="text-[10px] font-mono text-white/20 uppercase">
                            Sin colaboradores extra asignados
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCourse(null)}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#FF6B00] hover:text-white transition-all mt-auto"
                >
                  Cerrar Panel
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL ELIMINAR */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertTriangle size={30} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter">
                    Eliminar Cuenta
                  </h3>
                  <p className="text-[10px] font-mono text-white/40 uppercase">
                    Esta acción no tiene vuelta atrás
                  </p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                ¿Confirmas la eliminación total de{" "}
                <span className="text-white font-bold">
                  {selectedAdmin?.fullName}
                </span>
                ? Se borrarán sus accesos y privilegios.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl font-bold text-[10px] uppercase border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAdminAction}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-[10px] uppercase hover:bg-red-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
