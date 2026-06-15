"use client";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  BookOpen,
  Award,
  LogOut,
  Loader2,
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  Quote,
  AlertCircle,
  Key,
  X,
  Settings,
  User,
  Phone,
  Unlock,
  GraduationCap,
  ArrowRight,
  CalendarClock,
  Eye,
  EyeOff
} from "lucide-react";
import { getCurrentStudent, logout } from "@/actions/auth/auth";
import { getStudentCoursePath } from "@/actions/course/courses";
import {
  changePassword,
  updateContactInfo,
  updateUsername,
} from "@/actions/user";
import {
  getAvailableCoursesForStudent,
  quickEnrollCourse,
} from "@/actions/user_course/courseManagement";
import FaithMap from "@/components/student/FaithMap";
import UserTestimonyManager from "@/components/student/UserTestimonyManager";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [verse, setVerse] = useState({
    text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.",
    ref: "Salmos 119:105",
  });
  const router = useRouter();

  // ESTADOS DEL MODAL DE AJUSTES
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "username" | "contact" | "password"
  >("username");

  // ESTADOS DE FORMULARIOS
  const [usernameData, setUsernameData] = useState("");
  const [contactData, setContactData] = useState({ phone: "", address: "" });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // ESTADOS DE RESPUESTA
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  // ESTADOS DE CURSOS DISPONIBLES (SUGERENCIAS)
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [enrollModalCourse, setEnrollModalCourse] = useState<any>(null);
  const [enrollCode, setEnrollCode] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // CARGAR DATOS INICIALES
  const loadData = async () => {
    const data = await getCurrentStudent();
    if (!data) {
      router.push("/login-estudiante");
      return;
    }
    setStudent(data);
    setUsernameData(data.username || "");
    setContactData({
      phone: data.profile?.phone || "",
      address: data.profile?.address || "",
    });

    // Cargar sugerencias de cursos
    const availableRes = await getAvailableCoursesForStudent();
    if (availableRes.success) {
      setAvailableCourses(availableRes.courses || []);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // RESETEAR STATUS AL CAMBIAR DE PESTAÑA
  useEffect(() => {
    setStatus({ loading: false, error: "", success: "" });
  }, [activeTab]);

  const {
    data: roadmapData,
    mutate,
    isLoading: isLoadingRoadmap,
  } = useSWR(
    student && selectedCourseId
      ? `roadmap-${student.id}-${selectedCourseId}`
      : null,
    async () => await getStudentCoursePath(selectedCourseId!, student.id),
    { revalidateOnFocus: false },
  );

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // --- MANEJADORES DE ENVÍO (AJUSTES) ---
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    const res = await updateUsername(usernameData);
    if (res?.error)
      setStatus({ loading: false, error: res.error, success: "" });
    else
      setStatus({
        loading: false,
        error: "",
        success: res?.success || "Actualizado",
      });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    const res = await updateContactInfo(contactData);
    if (res?.error)
      setStatus({ loading: false, error: res.error, success: "" });
    else
      setStatus({
        loading: false,
        error: "",
        success: res?.success || "Actualizado",
      });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    if (passwords.new !== passwords.confirm) {
      setStatus({
        loading: false,
        error: "Las contraseñas nuevas no coinciden.",
        success: "",
      });
      return;
    }
    const res = await changePassword(passwords.current, passwords.new);
    if (res?.error) {
      setStatus({ loading: false, error: res.error, success: "" });
    } else if (res?.success) {
      setStatus({ loading: false, error: "", success: res.success });
      setTimeout(() => {
        setPasswords({ current: "", new: "", confirm: "" });
        setStatus({ loading: false, error: "", success: "" });
      }, 2000);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const val = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    
    if (val.length > 1) {
      const newCode = [...codeDigits];
      for (let i = 0; i < val.length && index + i < 6; i++) {
        newCode[index + i] = val[i];
      }
      setCodeDigits(newCode);
      const nextIndex = Math.min(index + val.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...codeDigits];
    newCode[index] = val;
    setCodeDigits(newCode);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --- MANEJADOR QUICK ENROLL ---
  const handleQuickEnroll = async () => {
    const fullCode = codeDigits.join("");
    if (fullCode.length < 6) {
      toast.error("El código debe tener 6 caracteres");
      return;
    }
    setEnrolling(true);
    const res = await quickEnrollCourse(enrollModalCourse.id, fullCode);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.success);
      setEnrollModalCourse(null);
      setCodeDigits(Array(6).fill(""));
      // Recargamos todos los datos del dashboard
      await loadData();
    }
    setEnrolling(false);
  };

  if (!student)
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
      </div>
    );

  const registrations = student.courseRegistration || [];
  // Aquí usamos la lógica que tengas para determinar si está completo o no
  // Asumiendo que `isCompleted` viene en el curso o puedes chequear progreso, por ahora usaremos una lógica simple.
  const completedCourses = registrations.filter((r: any) => r.isCompleted);
  const activeCourses = registrations.filter((r: any) => !r.isCompleted);

  return (
    <main className="min-h-screen bg-[#060606] text-white selection:bg-[#FF6B00]">
      {!selectedCourseId ? (
        <div className="max-w-7xl mx-auto p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* HEADER PASTORAL */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                <LayoutGrid size={22} className="text-[#FF6B00]" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">
                  Panel de Alumno
                </p>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">
                  Shalom,{" "}
                  <span className="text-[#FF6B00]">
                    {student.fullName.split(" ")[0]}
                  </span>
                </h1>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <Settings
                  size={16}
                  className="text-white/40 group-hover:text-white transition-colors"
                />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                  Ajustes
                </span>
              </button>

              <button
                onClick={handleLogout}
                className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-500/10 transition-colors group"
                title="Cerrar Sesión"
              >
                <LogOut
                  size={20}
                  className="text-white/20 group-hover:text-red-500 transition-colors"
                />
              </button>
            </div>
          </header>

          <div className="space-y-8">
            {/* SECCIÓN SUPERIOR: BIENVENIDA Y VERSÍCULO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#FF6B00]/10 to-transparent border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group">
                <Quote className="absolute -right-4 -bottom-4 text-white/[0.03] w-48 h-48" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles size={14} className="text-[#FF6B00]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00]">
                      Palabra del Día
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-medium italic leading-relaxed mb-4 text-white/90">
                    "{verse.text}"
                  </h2>
                  <p className="text-[#FF6B00] font-black uppercase tracking-widest text-[10px]">
                    — {verse.ref}
                  </p>
                </div>
              </div>

              <div className="bg-[#FF6B00] p-10 rounded-[2.5rem] flex flex-col justify-between text-black group hover:scale-[1.02] transition-transform shadow-2xl">
                <Award size={40} className="mb-8" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                    Rango Ministerial
                  </p>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
                    {student.rank || "Alumno"}
                  </h3>
                </div>
              </div>
            </div>

            {/* CURSOS EN PROGRESO (ACTIVOS) */}
            {activeCourses.length > 0 && (
              <div className="pt-10">
                <div className="flex items-center gap-4 mb-8 text-white/20">
                  <PlayCircle size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                    Sendas en Curso
                  </h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCourses.map((reg: any) => (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedCourseId(reg.courseId)}
                      className="group relative bg-[#0d0d0d] border border-[#FF6B00]/20 p-8 rounded-[2.5rem] hover:bg-[#FF6B00]/5 hover:border-[#FF6B00]/60 transition-all text-left overflow-hidden shadow-2xl"
                    >
                      <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="w-12 h-12 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl flex items-center justify-center">
                          <BookOpen size={20} className="text-[#FF6B00]" />
                        </div>
                        <ChevronRight className="text-white/20 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
                      </div>
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2 leading-none text-white relative z-10">
                        {reg.course.name}
                      </h4>
                      <p className="text-xs text-white/50 line-clamp-2 font-medium mb-6">
                        {reg.course.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                        <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest relative z-10">
                          Continuar lección
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NUEVOS CURSOS DISPONIBLES (SUGERENCIAS) */}
            {availableCourses.length > 0 && (
              <div className="pt-10">
                <div className="flex items-center gap-4 mb-8 text-white/20">
                  <Sparkles size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                    Nuevos Caminos Disponibles
                  </h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCourses.map((course: any) => (
                    <div
                      key={course.id}
                      className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                            <GraduationCap
                              size={18}
                              className="text-white/40"
                            />
                          </div>
                          {course.deadline && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full">
                              <CalendarClock
                                size={12}
                                className="text-white/40"
                              />
                              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                {new Date(course.deadline).toLocaleDateString(
                                  "es-AR",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2 text-white">
                          {course.name}
                        </h4>
                        <p className="text-xs text-white/40 line-clamp-3 mb-6">
                          {course.description}
                        </p>
                      </div>

                      <button
                        onClick={() => setEnrollModalCourse(course)}
                        className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                      >
                        <Unlock
                          size={14}
                          className="group-hover:text-[#FF6B00]"
                        />
                        Inscribirme
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CURSOS FINALIZADOS */}
            {completedCourses.length > 0 && (
              <div className="pt-10">
                <div className="flex items-center gap-4 mb-8 text-white/20">
                  <CheckCircle2 size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                    Sendas Finalizadas
                  </h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {completedCourses.map((reg: any) => (
                    <div
                      key={reg.id}
                      className="bg-green-500/5 border border-green-500/20 p-6 rounded-[2rem] flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <Award size={20} className="text-green-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase italic tracking-tighter text-white">
                          {reg.course.name}
                        </h4>
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-1">
                          Completado
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-10">
              <UserTestimonyManager />
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DE MAPA FULL-SCREEN */
        <div className="w-full min-h-screen flex flex-col animate-in fade-in zoom-in-95 duration-500 bg-[#050505]">
          <nav className="w-full p-6 md:p-8 flex justify-between items-center border-b border-white/5 bg-[#060606]">
            <button
              onClick={() => setSelectedCourseId(null)}
              className="flex items-center gap-3 text-white/40 hover:text-white transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FF6B00] group-hover:text-black transition-all">
                <ArrowLeft size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Volver al Panel
              </span>
            </button>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 block mb-1">
                Formación Ministerial
              </span>
              <h2 className="text-xl font-black uppercase italic text-[#FF6B00] tracking-tighter">
                {roadmapData?.courseName || "Cargando..."}
              </h2>
            </div>
          </nav>
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
            {isLoadingRoadmap ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                  Desplegando camino de fe...
                </p>
              </div>
            ) : roadmapData?.roadmap && roadmapData.roadmap.length > 0 ? (
              <div className="w-full h-full">
                <FaithMap
                  roadmap={roadmapData.roadmap}
                  userId={student.id}
                  onRefresh={mutate}
                  courseName={roadmapData.courseName}
                />
              </div>
            ) : (
              <div className="max-w-md text-center space-y-6 p-10 bg-white/5 border border-white/10 rounded-[3rem]">
                <AlertCircle className="mx-auto text-[#FF6B00]" size={48} />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Senda en Construcción
                </h3>
                <p className="text-white/40 text-xs font-medium leading-relaxed">
                  El Pastor aún está preparando las lecciones para este camino.
                  Vuelve pronto para comenzar tu formación.
                </p>
                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-[#FF6B00] transition-colors shadow-2xl"
                >
                  Regresar al Panel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL QUICK ENROLL ================= */}
      <AnimatePresence>
        {enrollModalCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 md:gap-12"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#FF6B00]/5 blur-[100px] pointer-events-none" />

              <button
                onClick={() => {
                  setEnrollModalCourse(null);
                  setCodeDigits(Array(6).fill(""));
                }}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* Columna Izquierda: Info del Curso */}
              <div className="flex-1 relative z-10 flex flex-col justify-center space-y-6 md:border-r md:border-white/10 md:pr-10">
                <div>
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-5">
                    <BookOpen className="text-white/60" size={24} />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic text-white leading-none mb-4">
                    {enrollModalCourse.name}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {enrollModalCourse.description || "Sin descripción detallada."}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <User size={18} className="text-[#FF6B00]" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Cupos Ocupados</p>
                      <p className="text-sm font-bold text-white">
                        {enrollModalCourse._count?.courseRegistration || 0} / {enrollModalCourse.quotaLimit || "∞"}
                      </p>
                    </div>
                  </div>
                  {enrollModalCourse.deadline && (
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <CalendarClock size={18} className="text-[#FF6B00]" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Fecha Límite</p>
                        <p className="text-sm font-bold text-white">
                          {new Date(enrollModalCourse.deadline).toLocaleDateString("es-AR", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Ingreso de Código */}
              <div className="w-full md:w-[40%] relative z-10 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-2xl flex items-center justify-center mb-6">
                  <Key className="text-[#FF6B00]" size={24} />
                </div>
                <h4 className="text-xl font-black uppercase italic text-white mb-2">
                  Código de <span className="text-[#FF6B00]">Acceso</span>
                </h4>
                <p className="text-xs text-white/50 font-medium mb-8 max-w-[250px]">
                  Ingresa los 6 dígitos proporcionados para entrar al curso.
                </p>

                <div className="w-full flex flex-col items-center gap-8">
                  <div className="flex gap-2 justify-center">
                    {codeDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-12 md:w-12 md:h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl md:text-2xl font-black text-white focus:text-[#FF6B00] focus:bg-[#FF6B00]/5 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none transition-all uppercase placeholder-white/10 shadow-inner"
                        placeholder="-"
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleQuickEnroll}
                    disabled={enrolling || codeDigits.join("").length < 6}
                    className="w-full max-w-[250px] py-4 bg-[#FF6B00] text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex justify-center items-center gap-2 group"
                  >
                    {enrolling ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Validar e Iniciar{" "}
                        <ArrowRight
                          size={16}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL DE AJUSTES ================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none mb-1">
                  Ajustes
                </h3>
                <p className="text-[10px] text-white/40 font-black tracking-widest uppercase">
                  Personaliza tu experiencia
                </p>
              </div>

              {/* TABS DE NAVEGACIÓN */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-8">
                <button
                  onClick={() => setActiveTab("username")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "username"
                      ? "bg-[#FF6B00] text-black shadow-lg"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <User size={14} /> Usuario
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "contact"
                      ? "bg-[#FF6B00] text-black shadow-lg"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <Phone size={14} /> Contacto
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "password"
                      ? "bg-[#FF6B00] text-black shadow-lg"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <Key size={14} /> Clave
                </button>
              </div>

              {/* --- FORMULARIO DE USUARIO --- */}
              {activeTab === "username" && (
                <form
                  onSubmit={handleUsernameSubmit}
                  className="space-y-4 animate-in fade-in zoom-in-95 duration-300"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      required
                      value={usernameData}
                      onChange={(e) => setUsernameData(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                      placeholder="Ej: juanperez123"
                    />
                  </div>
                  {status.error && (
                    <p className="text-red-500 text-xs text-center bg-red-500/10 p-2 rounded-lg">
                      {status.error}
                    </p>
                  )}
                  {status.success && (
                    <p className="text-green-500 text-xs text-center bg-green-500/10 p-2 rounded-lg">
                      {status.success}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status.loading}
                    className="w-full py-4 mt-2 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[#FF6B00] transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {status.loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Actualizar Usuario"
                    )}
                  </button>
                </form>
              )}

              {/* --- FORMULARIO DE CONTACTO --- */}
              {activeTab === "contact" && (
                <form
                  onSubmit={handleContactSubmit}
                  className="space-y-4 animate-in fade-in zoom-in-95 duration-300"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={contactData.phone}
                      onChange={(e) =>
                        setContactData({
                          ...contactData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={contactData.address}
                      onChange={(e) =>
                        setContactData({
                          ...contactData,
                          address: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                      placeholder="Calle Principal 123"
                    />
                  </div>
                  {status.error && (
                    <p className="text-red-500 text-xs text-center bg-red-500/10 p-2 rounded-lg">
                      {status.error}
                    </p>
                  )}
                  {status.success && (
                    <p className="text-green-500 text-xs text-center bg-green-500/10 p-2 rounded-lg">
                      {status.success}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status.loading}
                    className="w-full py-4 mt-2 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[#FF6B00] transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {status.loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Actualizar Contacto"
                    )}
                  </button>
                </form>
              )}

              {/* --- FORMULARIO DE CONTRASEÑA --- */}
              {activeTab === "password" && (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4 animate-in fade-in zoom-in-95 duration-300"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={passwords.current}
                        onChange={(e) =>
                          setPasswords({ ...passwords, current: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={passwords.new}
                        onChange={(e) =>
                          setPasswords({ ...passwords, new: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={passwords.confirm}
                        onChange={(e) =>
                          setPasswords({ ...passwords, confirm: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {status.error && (
                    <p className="text-red-500 text-xs text-center bg-red-500/10 p-2 rounded-lg">
                      {status.error}
                    </p>
                  )}
                  {status.success && (
                    <p className="text-green-500 text-xs text-center bg-green-500/10 p-2 rounded-lg">
                      {status.success}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status.loading || !!status.success}
                    className="w-full py-4 mt-2 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[#FF6B00] transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {status.loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Actualizar Contraseña"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
