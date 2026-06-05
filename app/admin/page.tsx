"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  Star,
  ArrowRight,
  Loader2,
  Settings,
  Users,
  Video,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Clock,
  Calendar,
  X,
  Trash2,
  Eye,
  UserCog,
  Shield,
  AlertTriangle,
  Mail,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/auth";
import {
  getDashboardStats,
  getCoursesWithCount,
  getAdmins,
  getAdminCourses,
  deleteCourse,
} from "@/actions/admin/dashboard";
import { Role } from "@/lib/types/definitions";
import { toast } from "sonner";

const VERSES = [
  { text: "Todo lo puedo en Cristo que me fortalece.", ref: "Fil 4:13" },
  {
    text: "Sé los planes que tengo para vosotros, planes de bienestar.",
    ref: "Jer 29:11",
  },
  { text: "El Señor es mi pastor; nada me faltará.", ref: "Sal 23:1" },
  { text: "Encomienda al Señor tus obras.", ref: "Prov 16:3" },
  { text: "Fíate de Jehovah de todo tu corazón.", ref: "Prov 3:5" },
  {
    text: "No os afanéis por nada; sean conocidas vuestras peticiones.",
    ref: "Fil 4:6",
  },
  {
    text: "Buscad primeramente el reino de Dios y su justicia.",
    ref: "Mt 6:33",
  },
];

const getDailyVerse = () =>
  VERSES[Math.floor(Date.now() / 86400000) % VERSES.length];

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVars = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
      {time.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon?: any;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
      {Icon && <Icon className="text-[#FF6B00]" size={24} />}
      <div>
        <p className="font-mono text-[9px] tracking-widest text-white/30 uppercase mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-white tracking-tighter">
          {value.toLocaleString("es-AR")}
        </p>
      </div>
    </div>
  );
}

function CourseCard({
  course,
  index,
  showAdmin = false,
  onDelete,
}: {
  course: any;
  index: number;
  showAdmin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const fillPercent = Math.min(
    (course.studentCount / course.quotaLimit) * 100,
    100,
  );
  const isOpen = new Date(course.openEnrollment) <= new Date();
  const isExpired = new Date(course.deadline) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-[#0f0f0f] rounded-2xl p-5 hover:bg-[#141414] transition-all cursor-pointer"
      onClick={() => router.push(`/admin/courses?id=${course.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
          <BookOpen className="text-[#FF6B00]" size={24} />
        </div>
        <div
          className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            isExpired
              ? "bg-red-500/20 text-red-400"
              : isOpen
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {isExpired ? "Cerrado" : "Abierto"}
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-2 truncate">
        {course.name}
      </h3>

      {showAdmin && course.createdBy && (
        <p className="text-[10px] text-white/40 mb-2 flex items-center gap-1">
          <UserCog size={10} />
          {course.createdBy}
        </p>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] mb-2">
          <span className="text-white/50">Capacidad</span>
          <span className="text-white font-bold">
            {course.studentCount}/{course.quotaLimit}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className={`h-full rounded-full ${
              fillPercent >= 90
                ? "bg-red-500"
                : fillPercent >= 70
                  ? "bg-yellow-500"
                  : "bg-[#FF6B00]"
            }`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px]">
        <div className="flex items-center gap-1 text-white/40">
          <Users size={12} />
          <span>{course.studentCount}</span>
        </div>
        <div className="flex items-center gap-1 text-white/40">
          <Video size={12} />
          <span>{course.quotaLimit}</span>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(course.id);
            }}
            className="flex items-center gap-1 text-red-400 hover:text-red-300"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalArticles: 0,
    totalTestimonies: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const router = useRouter();
  const verse = getDailyVerse();

  const loadData = async () => {
    try {
      const [session, dashboardStats, coursesData] = await Promise.all([
        getCurrentUser(),
        getDashboardStats(),
        getCoursesWithCount(),
      ]);
      if (session) {
        setUser(session);
        setStats(dashboardStats);
        setCourses(coursesData);
      } else {
        router.push("/login-admin");
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleDeleteCourse = async (courseId: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.",
      )
    )
      return;

    try {
      await deleteCourse(courseId);
      toast.success("Curso eliminado correctamente");
      loadData();
    } catch (error) {
      toast.error("Error al eliminar el curso");
    }
  };

  if (loading) {
    return (
      // FIX: eliminado animate-spin con border anidados → causa glitch en Mali GPU
      // Reemplazado con Loader2 de lucide que usa CSS transform simple
      <div className="flex items-center justify-center min-h-[60vh] bg-[#050505]">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="text-[#FF6B00] animate-spin" size={40} />
          <p className="font-mono text-xs tracking-[0.3em] text-[#FF6B00] uppercase">
            Cargando sistema...
          </p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === Role.superadmin;
  const totalStudents = courses.reduce(
    (acc: number, c: any) => acc + c.studentCount,
    0,
  );
  const totalCupos = courses.reduce(
    (acc: number, c: any) => acc + c.quotaLimit,
    0,
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="bg-[#050505] min-h-screen p-4 md:p-8"
    >
      <div className="max-w-[1400px] mx-auto space-y-6">
        <motion.div variants={itemVars}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85] uppercase">
            Panel de {isSuperAdmin ? "Super Admin" : "Administración"}
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div
            variants={itemVars}
            className="lg:col-span-7 bg-[#0a0a0a] rounded-3xl p-6 md:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6B00]" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1">
                    Operador activo
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight uppercase">
                    {user?.fullName || user?.username || "Administrador"}
                  </h2>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-full">
                      <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full" />
                      <span className="font-mono text-[9px] tracking-widest text-[#FF6B00] uppercase">
                        {user?.role}
                      </span>
                    </span>
                    <LiveClock />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/admin/settings")}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-[#FF6B00] hover:border-[#FF6B00] transition-all"
                >
                  <Settings size={18} />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Usuarios"
                  value={stats.totalUsers}
                  icon={Users}
                />
                {isSuperAdmin ? (
                  <>
                    <StatCard
                      label="Testimonios"
                      value={stats.totalTestimonies}
                      icon={Star}
                    />
                    <StatCard
                      label="Artículos"
                      value={stats.totalArticles}
                      icon={FileText}
                    />
                  </>
                ) : (
                  <>
                    <StatCard
                      label="Alumnos"
                      value={totalStudents}
                      icon={GraduationCap}
                    />
                    <StatCard
                      label="Cupos"
                      value={totalCupos}
                      icon={BarChart3}
                    />
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* FIX: eliminado el div absoluto con el `"` gigante (font-black text-[120px] opacity-5)
              → texto enorme con opacity fuerza una compositing layer separada en Mali GPU
              → reemplazado con un borde decorativo izquierdo simple */}
          <motion.div
            variants={itemVars}
            className="lg:col-span-5 bg-[#0a0a0a] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col justify-center"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#FF6B00]/30 rounded-l-3xl" />
            <div className="relative z-10 pl-2">
              <p className="text-xl md:text-2xl text-white font-medium leading-relaxed italic">
                "{verse.text}"
              </p>
              <div className="flex items-center gap-2 mt-6">
                <div className="h-[1px] w-8 bg-[#FF6B00]" />
                <p className="font-mono text-[11px] tracking-[0.2em] text-[#FF6B00] uppercase">
                  {verse.ref}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVars} className="mt-6">
          <div className="flex items-center gap-3 py-4">
            <BookOpen size={14} className="text-[#FF6B00]" />
            <span className="font-mono text-[11px] tracking-[0.3em] text-white/50 uppercase">
              Mis Programas
            </span>
            <span className="px-2 py-0.5 bg-[#FF6B00]/20 text-[#FF6B00] text-[10px] font-bold rounded-full">
              {courses.length}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courses.length > 0 ? (
            courses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                showAdmin={isSuperAdmin}
                onDelete={
                  isSuperAdmin ? () => handleDeleteCourse(course.id) : undefined
                }
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/30">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay cursos activos</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
