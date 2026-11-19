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
import { toast } from "@/lib/toast";

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
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]" aria-busy="true">
        <Loader2 className="animate-spin text-[#FF6B00]" size={32} aria-label="Cargando" />
      </div>
    );

  const registrations = student.courseRegistration || [];
  const completedCourses = registrations.filter((r: any) => r.isCompleted);
  const activeCourses = registrations.filter((r: any) => !r.isCompleted);
  const firstName = (student.fullName || "").split(" ")[0];
  const today = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const rank = (student.rank || "concurre") as string;
  const shortDate = (d: string | Date) => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  const closeEnroll = () => {
    setEnrollModalCourse(null);
    setCodeDigits(Array(6).fill(""));
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-[#e7e5e4] bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30";
  const labelClass = "text-sm font-medium text-[#292524]";
  const primaryButton =
    "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const statusMessage = (
    <>
      {status.error && (
        <p role="alert" className="rounded-xl bg-[#fef2f2] px-4 py-2.5 text-sm text-red-700">
          {status.error}
        </p>
      )}
      {status.success && (
        <p role="status" className="rounded-xl bg-[#ecfdf5] px-4 py-2.5 text-sm text-green-700">
          {status.success}
        </p>
      )}
    </>
  );

  const passwordField = (id: string, label: string, key: "current" | "new" | "confirm", placeholder: string, extra?: object) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          required
          value={passwords[key]}
          onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
          className={`${inputClass} pr-12`}
          placeholder={placeholder}
          {...extra}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Ocultar contraseñas" : "Mostrar contraseñas"}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a]"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const sectionTitle = (title: string, count?: number) => (
    <div className="mb-4 flex items-baseline gap-2">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      {count !== undefined && <span className="text-sm tabular-nums text-[#57534e]">{count}</span>}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      {!selectedCourseId ? (
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 md:px-6 md:pt-10">
          {/* ENCABEZADO */}
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]">
                <img src="/Logo.webp" alt="" className="h-5 w-5 brightness-0 invert" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-[#57534e] first-letter:uppercase">{today}</p>
                <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">Hola, {firstName}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Ajustes"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7e5e4] bg-white px-3 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] sm:px-4"
              >
                <Settings size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Ajustes</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e5e4] bg-white text-[#57534e] transition-colors hover:bg-[#fef2f2] hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* PALABRA DEL DÍA Y ESTADO */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <figure className="relative overflow-hidden rounded-[1.75rem] border border-[#e7e5e4] bg-white p-6 md:col-span-2 md:p-8">
              <Quote aria-hidden="true" className="absolute -bottom-6 -right-4 h-36 w-36 text-[#f5f5f4]" />
              <p className="relative flex items-center gap-2 text-sm font-medium text-[#C2410C]">
                <Sparkles size={15} aria-hidden="true" /> Palabra del día
              </p>
              <blockquote className="relative mt-4 text-xl font-medium leading-snug tracking-[-0.01em] text-balance md:text-2xl">
                “{verse.text}”
              </blockquote>
              <figcaption className="relative mt-3 text-sm text-[#57534e]">{verse.ref}</figcaption>
            </figure>

            <div className="flex flex-col justify-between rounded-[1.75rem] bg-[#FF6B00] p-6 text-black md:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10">
                <Award size={20} aria-hidden="true" />
              </span>
              <div className="mt-8">
                <p className="text-sm font-medium text-black/70">Tu estado en la iglesia</p>
                <p className="text-3xl font-semibold capitalize tracking-[-0.03em]">{rank}</p>
              </div>
            </div>
          </div>

          {/* MIS CURSOS */}
          <section className="mt-12" aria-labelledby="mis-cursos">
            <div id="mis-cursos">{sectionTitle("Mis cursos", activeCourses.length)}</div>
            {activeCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeCourses.map((reg: any) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setSelectedCourseId(reg.courseId)}
                    className="group flex flex-col rounded-[1.5rem] border border-[#e7e5e4] bg-white p-5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-[border-color,transform] duration-200 hover:border-[#d6d3d1] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7ed] text-[#C2410C]">
                      <BookOpen size={18} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 line-clamp-2 text-xl font-semibold capitalize leading-tight tracking-[-0.02em]">
                      {reg.course.name.toLowerCase()}
                    </h3>
                    {reg.course.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-[#57534e]">{reg.course.description}</p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#C2410C]">
                      Continuar
                      <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[#d6d3d1] px-6 py-10 text-center">
                <p className="font-semibold">Todavía no estás en ningún curso</p>
                <p className="mt-1 text-sm text-[#57534e]">Inscribite en uno de los cursos disponibles con el código que te dieron.</p>
              </div>
            )}
          </section>

          {/* CURSOS DISPONIBLES */}
          {availableCourses.length > 0 && (
            <section className="mt-12" aria-labelledby="cursos-disponibles">
              <div id="cursos-disponibles">{sectionTitle("Cursos disponibles", availableCourses.length)}</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableCourses.map((course: any) => {
                  const registered = course._count?.courseRegistration || 0;
                  const isFull = course.quotaLimit > 0 && registered >= course.quotaLimit;
                  const notOpenYet = course.openEnrollment && new Date(course.openEnrollment).getTime() > Date.now();
                  const isClosed = course.deadline && new Date(course.deadline).getTime() < Date.now();
                  const label = notOpenYet ? "Próximamente" : isFull ? "Sin cupos" : isClosed ? "Inscripción cerrada" : "Inscribirme";
                  return (
                    <article key={course.id} className="flex flex-col rounded-[1.5rem] border border-[#e7e5e4] bg-white p-5">
                      <h3 className="line-clamp-2 text-xl font-semibold capitalize leading-tight tracking-[-0.02em]">
                        {course.name.toLowerCase()}
                      </h3>
                      {course.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-[#57534e]">{course.description}</p>
                      )}
                      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[#57534e]">
                        <li className="flex items-center gap-1.5">
                          <User size={15} aria-hidden="true" />
                          Cupos <strong className="font-semibold tabular-nums text-[#0a0a0a]">{registered}/{course.quotaLimit}</strong>
                        </li>
                        {notOpenYet ? (
                          <li className="flex items-center gap-1.5">
                            <CalendarClock size={15} aria-hidden="true" />
                            Abre <strong className="font-semibold text-[#0a0a0a]">{shortDate(course.openEnrollment)}</strong>
                          </li>
                        ) : (
                          course.deadline && (
                            <li className="flex items-center gap-1.5">
                              <CalendarClock size={15} aria-hidden="true" />
                              Cierra <strong className="font-semibold text-[#0a0a0a]">{shortDate(course.deadline)}</strong>
                            </li>
                          )
                        )}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setEnrollModalCourse(course)}
                        disabled={!!notOpenYet || isFull || !!isClosed}
                        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#e7e5e4] disabled:text-[#57534e] disabled:active:scale-100"
                      >
                        {label}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* CURSOS TERMINADOS */}
          {completedCourses.length > 0 && (
            <section className="mt-12" aria-labelledby="cursos-terminados">
              <div id="cursos-terminados">{sectionTitle("Cursos terminados", completedCourses.length)}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completedCourses.map((reg: any) => (
                  <div key={reg.id} className="flex items-center gap-3 rounded-2xl border border-[#e7e5e4] bg-white p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5] text-green-700">
                      <CheckCircle2 size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold capitalize">{reg.course.name.toLowerCase()}</p>
                      <p className="text-sm text-green-700">Completado</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12">
            <UserTestimonyManager />
          </div>
        </div>
      ) : (
        /* VISTA DEL CURSO */
        <div className="min-h-screen">
          <div className="sticky top-0 z-30 border-b border-[#e7e5e4] bg-[#fafaf9]/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-3xl items-center px-4 md:px-6">
              <button
                type="button"
                onClick={() => setSelectedCourseId(null)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#e7e5e4] bg-white pl-3 pr-4 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <ArrowLeft size={16} aria-hidden="true" /> Mis cursos
              </button>
            </div>
          </div>

          {isLoadingRoadmap ? (
            <div className="mx-auto max-w-3xl space-y-4 px-4 pt-8 md:px-6" aria-busy="true">
              <div className="h-10 w-64 animate-pulse rounded-xl bg-[#f5f5f4]" />
              <div className="h-16 animate-pulse rounded-2xl bg-[#f5f5f4]" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-[1.5rem] bg-[#f5f5f4]" />
              ))}
            </div>
          ) : roadmapData?.roadmap && roadmapData.roadmap.length > 0 ? (
            <FaithMap
              roadmap={roadmapData.roadmap}
              userId={student.id}
              onRefresh={mutate}
              courseName={roadmapData.courseName}
            />
          ) : (
            <div className="mx-auto max-w-md px-4 pt-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff7ed] text-[#C2410C]">
                <AlertCircle size={24} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.01em]">Todavía no hay clases</h2>
              <p className="mt-2 text-sm text-[#57534e]">
                El encargado del curso está preparando las clases. Volvé pronto para empezar.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCourseId(null)}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-colors hover:bg-[#292524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
              >
                Volver a mis cursos
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= INSCRIPCIÓN CON CÓDIGO ================= */}
      <AnimatePresence>
        {enrollModalCourse && (
          <div className="fixed inset-0 z-[6000] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEnroll}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-inscripcion"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-md rounded-t-[2rem] bg-white p-6 text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:p-8"
            >
              <button
                type="button"
                onClick={closeEnroll}
                aria-label="Cerrar"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <X size={18} />
              </button>

              <p className="text-sm text-[#57534e]">Inscribirme en</p>
              <h3 id="titulo-inscripcion" className="pr-10 text-2xl font-semibold capitalize leading-tight tracking-[-0.02em]">
                {enrollModalCourse.name.toLowerCase()}
              </h3>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#57534e]">
                <span>
                  Cupos{" "}
                  <strong className="font-semibold tabular-nums text-[#0a0a0a]">
                    {enrollModalCourse._count?.courseRegistration || 0}/{enrollModalCourse.quotaLimit}
                  </strong>
                </span>
                {enrollModalCourse.deadline && (
                  <span>
                    Cierra <strong className="font-semibold text-[#0a0a0a]">{shortDate(enrollModalCourse.deadline)}</strong>
                  </span>
                )}
              </div>

              <fieldset className="mt-6">
                <legend className="sr-only">Código de acceso de 6 caracteres</legend>
                <div className="flex justify-between gap-2">
                  {codeDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="text"
                      autoCapitalize="characters"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      aria-label={`Carácter ${index + 1} de 6`}
                      className="h-14 w-full min-w-0 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] text-center font-mono text-2xl font-bold uppercase text-[#0a0a0a] focus:bg-white outline-none transition-[border-color,box-shadow] focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/30"
                    />
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={handleQuickEnroll}
                disabled={enrolling || codeDigits.join("").length < 6}
                className={`${primaryButton} mt-6`}
              >
                {enrolling ? (
                  <Loader2 className="animate-spin" size={18} aria-label="Inscribiendo" />
                ) : (
                  <>
                    Inscribirme <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= AJUSTES ================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-ajustes"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-md rounded-t-[2rem] bg-white p-6 text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <X size={18} />
              </button>

              <h3 id="titulo-ajustes" className="text-2xl font-semibold tracking-[-0.02em]">Ajustes</h3>
              <p className="mt-1 text-sm text-[#57534e]">Tus datos de acceso y de contacto.</p>

              <div role="tablist" aria-label="Secciones de ajustes" className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-[#f5f5f4] p-1">
                {[
                  { id: "username", label: "Usuario", icon: User },
                  { id: "contact", label: "Contacto", icon: Phone },
                  { id: "password", label: "Contraseña", icon: Key },
                ].map((t) => {
                  const active = activeTab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`relative flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                        active ? "text-white" : "text-[#57534e] hover:text-[#0a0a0a]"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="ajustes-pestana"
                          className="absolute inset-0 rounded-full bg-[#0a0a0a]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <Icon size={15} className="relative" aria-hidden="true" />
                      <span className="relative">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {activeTab === "username" && (
                <form onSubmit={handleUsernameSubmit} className="mt-6 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ajuste-usuario" className={labelClass}>Nombre de usuario</label>
                    <input
                      id="ajuste-usuario"
                      type="text"
                      required
                      autoComplete="username"
                      value={usernameData}
                      onChange={(e) => setUsernameData(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: juanperez"
                    />
                  </div>
                  {statusMessage}
                  <button type="submit" disabled={status.loading} className={primaryButton}>
                    {status.loading ? <Loader2 className="animate-spin" size={18} /> : "Guardar usuario"}
                  </button>
                </form>
              )}

              {activeTab === "contact" && (
                <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ajuste-telefono" className={labelClass}>Teléfono</label>
                    <input
                      id="ajuste-telefono"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                      className={inputClass}
                      placeholder="Ej: 3704 123456"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ajuste-direccion" className={labelClass}>Dirección o ciudad</label>
                    <input
                      id="ajuste-direccion"
                      type="text"
                      autoComplete="street-address"
                      value={contactData.address}
                      onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                      className={inputClass}
                      placeholder="Ej: Don Bosco 1234"
                    />
                  </div>
                  {statusMessage}
                  <button type="submit" disabled={status.loading} className={primaryButton}>
                    {status.loading ? <Loader2 className="animate-spin" size={18} /> : "Guardar contacto"}
                  </button>
                </form>
              )}

              {activeTab === "password" && (
                <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                  {passwordField("ajuste-clave-actual", "Contraseña actual", "current", "••••••••", { autoComplete: "current-password" })}
                  {passwordField("ajuste-clave-nueva", "Contraseña nueva", "new", "Mínimo 8 caracteres", { minLength: 8, autoComplete: "new-password" })}
                  {passwordField("ajuste-clave-repetir", "Repetí la contraseña nueva", "confirm", "••••••••", { autoComplete: "new-password" })}
                  {statusMessage}
                  <button type="submit" disabled={status.loading || !!status.success} className={primaryButton}>
                    {status.loading ? <Loader2 className="animate-spin" size={18} /> : "Cambiar contraseña"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
