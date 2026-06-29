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
  Calendar,
  X,
  Trash2,
  Eye,
  UserCog,
  Shield,
  AlertTriangle,
  Mail,
  CalendarDays,
  Activity,
  Layers,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/auth";
import { getDashboardStats, getCoursesWithCount, deleteCourse } from "@/actions/admin/dashboard";
import { Role } from "@/lib/types/definitions";
import { toast } from "sonner";

const VERSES = [
  { text: "Todo lo puedo en Cristo que me fortalece.", ref: "Fil 4:13" },
  { text: "Sé los planes que tengo para vosotros, planes de bienestar y no de calamidad.", ref: "Jer 29:11" },
  { text: "El Señor es mi pastor; nada me faltará.", ref: "Sal 23:1" },
  { text: "Encomienda al Señor tus obras, y tus pensamientos serán afirmados.", ref: "Prov 16:3" },
  { text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.", ref: "Prov 3:5" },
  { text: "No os afanéis por nada; sean conocidas vuestras peticiones ante Dios.", ref: "Fil 4:6" },
  { text: "Buscad primeramente el reino de Dios y su justicia, y todo se os añadirá.", ref: "Mt 6:33" },
];

const getDailyVerse = () => VERSES[Math.floor(Date.now() / 86400000) % VERSES.length];

const containerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] } },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono text-[10px] tracking-widest text-[#FF6B00] font-black uppercase bg-[#FF6B00]/10 px-3 py-1 rounded-full border border-[#FF6B00]/20">
      {time.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

// Tarjeta Bento de métricas simple
function MiniMetricCard({ label, value, description, icon: Icon, colorClass = "text-[#FF6B00]" }: { label: string; value: number; description: string; icon: any; colorClass?: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-36 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[40px] -mr-8 -mt-8 group-hover:bg-[#FF6B00]/5 transition-all" />
      <div className="flex justify-between items-start relative z-10">
        <span className="font-mono text-[9px] tracking-widest text-white/30 uppercase font-black">{label}</span>
        <div className={`p-2 bg-white/5 rounded-xl ${colorClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-3xl font-black tracking-tighter text-white leading-none mb-1">
          {value.toLocaleString("es-AR")}
        </h4>
        <p className="text-[10px] text-white/40 font-bold uppercase">{description}</p>
      </div>
    </div>
  );
}

// Tarjeta rediseñada de Cursos en Formato Bento
function BentoCourseCard({ course, index, showAdmin = false, onDelete }: { course: any; index: number; showAdmin?: boolean; onDelete?: (id: string) => void }) {
  const router = useRouter();
  const fillPercent = Math.min((course.studentCount / course.quotaLimit) * 100, 100);
  const isOpen = new Date(course.openEnrollment) <= new Date();
  const isExpired = new Date(course.deadline) < new Date();
  const deadline = new Date(course.deadline).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      variants={itemVars}
      onClick={() => router.push(`/admin/courses?id=${course.id}`)}
      className="group relative bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] hover:border-[#FF6B00]/40 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[300px]"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-[#FF6B00]/10 transition-all duration-700" />
      
      <div className="p-8 relative z-10 flex-1 flex flex-col justify-between">
        {/* Cabecera Tarjeta */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#FF6B00] transition-colors duration-500">
            <BookOpen className="text-[#FF6B00] group-hover:text-black transition-colors" size={20} />
          </div>
          
          <div className="flex gap-2">
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
              isExpired ? "bg-red-500/10 text-red-400 border border-red-500/20" : isOpen ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            }`}>
              {isExpired ? "Cerrado" : "Activo"}
            </div>
          </div>
        </div>

        {/* Título & Detalle */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none text-white group-hover:text-[#FF6B00] transition-colors duration-300">
            {course.name}
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 py-1 px-3 rounded-full text-white/50 text-[10px] font-bold">
              <CalendarDays size={10} className="text-[#FF6B00]" />
              <span>Cierre: {deadline}</span>
            </div>
            
            {showAdmin && course.createdBy && (
              <div className="flex items-center gap-1.5 bg-white/5 py-1 px-3 rounded-full text-white/40 text-[10px] font-bold">
                <UserCog size={10} className="text-[#FF6B00]" />
                <span className="truncate max-w-[80px]">{course.createdBy}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progreso de Cupos */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40 uppercase font-black tracking-widest">Inscripción</span>
            <span className="text-white font-bold bg-white/5 px-2.5 py-0.5 rounded-md">
              {course.studentCount} / {course.quotaLimit} alumnos
            </span>
          </div>
          
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-yellow-500" : "bg-[#FF6B00]"
              } shadow-[0_0_10px_rgba(255,107,0,0.3)]`}
            />
          </div>
        </div>
      </div>

      {/* Pie de la tarjeta */}
      <div className="px-8 pb-8 relative z-10 flex items-center justify-between border-t border-white/5 pt-4 bg-white/[0.01]">
        <div className="flex items-center gap-4 text-[10px] text-white/50 font-black uppercase tracking-widest group-hover:text-white transition-colors duration-300">
          Gestionar Cursos
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(course.id);
            }}
            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300"
            title="Eliminar Curso"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalArticles: 0, totalTestimonies: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  
  // Estados para el Modal Casero de Borrado
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

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
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-[#050505]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-2 border-[#FF6B00] relative animate-spin">
            <div className="absolute inset-2 border-2 border-[#FF6B00]/30" />
            <div className="absolute inset-4 border-2 border-[#FF6B00]/10" />
          </div>
          <p className="font-mono text-xs tracking-[0.3em] text-[#FF6B00] uppercase animate-pulse">Iniciando el Templo...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === Role.superadmin;
  const totalStudents = courses.reduce((acc: number, c: any) => acc + c.studentCount, 0);
  const totalCupos = courses.reduce((acc: number, c: any) => acc + c.quotaLimit, 0);
  
  // Gráfico de Dona en SVG
  const cuposOcupados = totalStudents;
  const cuposDisponibles = Math.max(totalCupos - totalStudents, 0);
  const porcentajeOcupacion = totalCupos > 0 ? Math.round((cuposOcupados / totalCupos) * 100) : 0;
  
  // Configuración del círculo SVG
  const radio = 36;
  const circunferencia = 2 * Math.PI * radio; // 226.19
  const strokeOffset = circunferencia - (porcentajeOcupacion / 100) * circunferencia;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="bg-[#050505] min-h-screen text-white p-4 md:p-8"
    >
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* ENCABEZADO DE BIENVENIDA */}
        <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="text-[#FF6B00]" size={14} />
              <span className="text-[#FF6B00] font-mono text-[9px] tracking-[0.4em] uppercase font-black">
                Panel Central
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
              Control <span className="text-[#FF6B00]">{isSuperAdmin ? "SuperAdmin" : "Administración"}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <LiveClock />
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/admin/settings")}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-[#FF6B00] hover:border-[#FF6B00] transition-all duration-300"
              title="Configuración"
            >
              <Settings size={18} />
            </motion.button>
          </div>
        </motion.div>

        {/* BENTO GRID SUPERIOR - GRÁFICOS Y MÉTRICAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* TARJETA DE BIENVENIDA (OPERADOR) */}
          <motion.div variants={itemVars} className="lg:col-span-4 bg-gradient-to-br from-[#0c0c0c] to-[#060606] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF6B00]/5 rounded-full blur-[60px]" />
            <div>
              <p className="font-mono text-[8px] tracking-[0.3em] text-white/30 uppercase font-black mb-2">Usuario Conectado</p>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                {user?.fullName || user?.username || "Administrador"}
              </h2>
              <p className="text-xs text-white/40 mt-1">Conectado a la red de Juntos Somos Iglesia</p>
            </div>
            <div className="flex gap-2 mt-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl">
                <Shield size={12} className="text-[#FF6B00]" />
                <span className="font-mono text-[9px] tracking-wider text-[#FF6B00] uppercase font-black">{user?.role}</span>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="font-mono text-[9px] tracking-wider text-white/60 uppercase font-black">Activo</span>
              </span>
            </div>
          </motion.div>

          {/* TARJETA DE GRÁFICOS - LA VISTA PARA EL PASTOR */}
          <motion.div variants={itemVars} className="lg:col-span-5 bg-gradient-to-br from-[#0c0c0c] to-[#060606] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden min-h-[220px]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF6B00]/5 rounded-full blur-[80px]" />
            <p className="font-mono text-[8px] tracking-[0.3em] text-white/30 uppercase font-black mb-4">Métricas de la Academia</p>
            
            <div className="flex items-center justify-between gap-6">
              {/* Gráfico circular en SVG */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="100" height="100" viewBox="0 0 80 80" className="transform -rotate-90">
                  <circle cx="40" cy="40" r={radio} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r={radio}
                    fill="transparent"
                    stroke="#FF6B00"
                    strokeWidth="6"
                    strokeDasharray={circunferencia}
                    initial={{ strokeDashoffset: circunferencia }}
                    animate={{ strokeDashoffset: strokeOffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black tracking-tighter text-white leading-none">{porcentajeOcupacion}%</span>
                  <span className="text-[7px] font-black uppercase text-white/30 tracking-widest mt-0.5">Cupos</span>
                </div>
              </div>

              {/* Leyenda y detalles */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#FF6B00]" />
                  <span className="text-xs font-bold text-white/80">Ocupación de Alumnos</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                  <div>
                    <span className="block text-[8px] font-black uppercase text-white/35 tracking-widest">Inscritos</span>
                    <span className="text-lg font-black text-white">{cuposOcupados}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black uppercase text-white/35 tracking-widest">Disponibles</span>
                    <span className="text-lg font-black text-[#FF6B00]">{cuposDisponibles}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* TARJETA DE PALABRA DE DIOS (VERSÍCULO DIARIO) */}
          <motion.div variants={itemVars} className="lg:col-span-3 bg-gradient-to-br from-[#0c0c0c] to-[#060606] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
            <p className="font-mono text-[8px] tracking-[0.3em] text-[#FF6B00] uppercase font-black mb-4">// Mensaje de Hoy</p>
            <div className="relative z-10">
              <p className="text-base md:text-lg text-white/90 font-medium leading-relaxed italic pr-4">
                "{verse.text}"
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-[1px] w-6 bg-[#FF6B00]" />
              <p className="font-mono text-[10px] tracking-wider text-[#FF6B00] uppercase font-black">{verse.ref}</p>
            </div>
          </motion.div>

        </div>

        {/* MINI CARDS DE ESTADÍSTICAS ADICIONALES */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniMetricCard label="Fieles Registrados" value={stats.totalUsers} description="Comunidad total" icon={Users} />
          <MiniMetricCard label="Programas Activos" value={stats.totalCourses} description="Academias de formación" icon={BookOpen} colorClass="text-emerald-400" />
          <MiniMetricCard label="Testimonios de Fe" value={stats.totalTestimonies} description="Vidas transformadas" icon={Star} colorClass="text-yellow-400" />
          <MiniMetricCard label="Artículos del Blog" value={stats.totalArticles} description="Enseñanzas publicadas" icon={FileText} colorClass="text-blue-400" />
        </div>

        {/* GRILLA DE PROGRAMAS DE FORMACIÓN */}
        <div className="space-y-6">
          <motion.div variants={itemVars} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-8">
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-[#FF6B00]" />
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                Programas de Formación
              </h3>
              <span className="px-2.5 py-0.5 bg-[#FF6B00]/15 text-[#FF6B00] text-[10px] font-black rounded-md border border-[#FF6B00]/25">
                {courses.length}
              </span>
            </div>
            
            {isSuperAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/admin/courses")}
                className="flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-white text-black font-black uppercase tracking-widest text-[10px] px-6 py-3.5 rounded-2xl transition-all duration-300"
              >
                <PlusCircle size={14} />
                Crear Nuevo Curso
              </motion.button>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length > 0 ? (
              courses.map((course, i) => (
                <BentoCourseCard
                  key={course.id}
                  course={course}
                  index={i}
                  showAdmin={isSuperAdmin}
                  onDelete={isSuperAdmin ? (id) => setConfirmDeleteId(id) : undefined}
                />
              ))
            ) : (
              <div className="col-span-full py-16 text-center border border-white/5 bg-white/[0.01] rounded-[2.5rem] text-white/30 space-y-4">
                <BookOpen size={48} className="mx-auto opacity-20" />
                <h4 className="text-lg font-bold uppercase italic tracking-tighter">Sin programas activos</h4>
                <p className="text-xs text-white/40 max-w-xs mx-auto">No hay cursos de formación cargados en la base de datos de la academia en este momento.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL CASERO DE CONFIRMACIÓN DE BORRADO DE CURSO (RESPONSIVO Y MODERNO) */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-6 text-center"
            >
              {/* Icono de advertencia animado */}
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={28} className="animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  ¿Eliminar Programa?
                </h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-[280px] mx-auto">
                  Esta acción eliminará de forma permanente el curso seleccionado y todos los registros de alumnos asociados. Esta acción no se puede deshacer.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={confirming}
                  className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setConfirming(true);
                    try {
                      await deleteCourse(confirmDeleteId);
                      toast.success("Curso eliminado correctamente");
                      await loadData();
                    } catch (error) {
                      toast.error("Error al eliminar el curso");
                    } finally {
                      setConfirming(false);
                      setConfirmDeleteId(null);
                    }
                  }}
                  disabled={confirming}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                >
                  {confirming ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}