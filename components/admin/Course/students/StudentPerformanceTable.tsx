"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Check,
  Clock,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  User,
  Loader2,
  Users,
  Trash2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getStudentDetailedProgress,
  deleteStudents,
  deleteStudent,
} from "@/actions/course/students/students.course";
import { resetStudentAttempts } from "@/actions/user_course/evaluations/user.evaluations";
import { updateUserRank } from "@/actions/auth/management.users";
import { toast } from "@/lib/toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  students: any[];
  courseId: string;
  onSelectStudent?: (studentId: string) => void;
}

export default function StudentPerformanceTable({ students, courseId }: Props) {
  const router = useRouter();
  const [localStudents, setLocalStudents] = useState<any[]>(students || []);

  useEffect(() => {
    if (students) setLocalStudents(students);
  }, [students]);

  const [filter, setFilter] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<any[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [updatingRankId, setUpdatingRankId] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const filteredStudents = useMemo(() => {
    const baseList = Array.isArray(localStudents) ? localStudents : [];
    return baseList.filter((reg) => {
      const q = filter.toLowerCase().trim();
      return [reg?.user?.fullName, reg?.user?.username, reg?.user?.dni, reg?.user?.phone]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q));
    });
  }, [localStudents, filter]);

  const handleDownloadPDF = () => {
    if (localStudents.length === 0) {
      toast.error("No hay alumnos para exportar");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Lista de Alumnos Inscriptos", 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-AR")}`, 14, 28);

    const tableData = localStudents.map((reg: any) => [
      reg?.user?.fullName || "Sin registrar",
      reg?.user?.username ? `@${reg.user.username}` : "—",
      reg?.user?.dni || "Sin DNI",
      reg?.user?.phone || "—",
      reg?.user?.address || "Sin domicilio",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Nombre completo", "Usuario", "DNI", "Teléfono", "Dirección"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [255, 107, 0] },
      styles: { fontSize: 10 },
    });
    doc.save("lista_de_alumnos.pdf");
    toast.success("PDF descargado correctamente");
  };

  const handleViewHistory = async (userId: string, fullName: string) => {
    if (!userId) return;
    setLoadingHistory(true);
    setActiveStudent({ id: userId, name: fullName });
    try {
      const data = await getStudentDetailedProgress(courseId, userId);
      if (data) setSelectedHistory(data);
    } catch {
      toast.error("Error al cargar el historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReleaseStudent = async (videoId: string) => {
    if (!activeStudent) return;
    setIsResetting(videoId);
    try {
      const res = await resetStudentAttempts(activeStudent.id, videoId);
      if (res.success) {
        toast.success("Alumno liberado correctamente.");
        const updatedData = await getStudentDetailedProgress(courseId, activeStudent.id);
        if (updatedData) setSelectedHistory(updatedData);
      } else {
        toast.error(res.error || "No se pudo liberar al alumno");
      }
    } catch {
      toast.error("Error de conexión al liberar");
    } finally {
      setIsResetting(null);
    }
  };

  const handleRankChange = async (userId: string, newRank: string) => {
    if (!userId) return;
    setUpdatingRankId(userId);
    try {
      const res = await updateUserRank(userId, newRank);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success);
        setLocalStudents((prev) =>
          prev.map((reg) =>
            (reg.userId || reg?.user?.id) === userId
              ? { ...reg, user: { ...reg.user, rank: newRank } }
              : reg
          )
        );
      }
    } catch {
      toast.error("Error al cambiar el rango.");
    } finally {
      setUpdatingRankId(null);
    }
  };

  const handleClearCourse = async () => {
    setIsClearing(true);
    try {
      const res = await deleteStudents(courseId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Alumnos eliminados correctamente.");
        setLocalStudents([]);
        setShowClearConfirm(false);
        router.refresh();
      }
    } catch {
      toast.error("Ocurrió un error al vaciar el curso.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteIndividual = async () => {
    if (!studentToDelete) return;
    const userId = studentToDelete.userId || studentToDelete?.user?.id;
    setIsClearing(true);
    try {
      const res = await deleteStudent(courseId, userId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Alumno eliminado.");
        setLocalStudents((prev) => prev.filter((reg) => (reg.userId || reg?.user?.id) !== userId));
        setStudentToDelete(null);
        router.refresh();
      }
    } catch {
      toast.error("Error al eliminar el alumno.");
    } finally {
      setIsClearing(false);
    }
  };

  const btnGhost =
    "inline-flex h-10 items-center gap-2 rounded-full border border-[#e7e5e4] px-4 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]";
  const th = "px-4 py-3 text-left text-xs font-medium text-[#57534e]";
  const td = "px-4 py-3.5 text-sm";
  const formatDate = (d?: string | Date) =>
    d ? new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="w-full space-y-5 text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      {selectedHistory && activeStudent ? (
        /* ── PROGRESO DEL ALUMNO (en la misma sección) ── */
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { setSelectedHistory(null); setActiveStudent(null); }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#e7e5e4] pl-3 pr-4 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
            >
              <ChevronLeft size={16} aria-hidden="true" /> Volver a la lista
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7ed] text-sm font-semibold text-[#C2410C]">
                {activeStudent.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm text-[#57534e]">Progreso del alumno</p>
                <h3 className="text-lg font-semibold leading-tight tracking-[-0.01em]">{activeStudent.name}</h3>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {selectedHistory.length === 0 && (
              <p className="py-12 text-center text-sm text-[#57534e]">Este curso todavía no tiene clases.</p>
            )}
            {selectedHistory.map((video, vIdx) => (
              <div key={vIdx} className="overflow-hidden rounded-2xl border border-[#e7e5e4]">
                <div className="flex items-center justify-between gap-4 bg-[#fafaf9] px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-xs text-[#57534e]">Clase {video.order}</p>
                    <h4 className="truncate font-semibold">{video.title}</h4>
                  </div>
                  {(() => {
                    // Trabado = alguna pregunta con 2 intentos activos sin acertar (misma regla del servidor)
                    const isStuck = (video.videoReview || []).some((q: any) => {
                      const active = (q.examAnswers || []).filter((a: any) => !a.isArchived);
                      return active.length >= 2 && !active.some((a: any) => a.isCorrect);
                    });
                    const hasStarted = (video.videoReview || []).some((q: any) =>
                      (q.examAnswers || []).some((a: any) => !a.isArchived),
                    );

                    if (video.videoProgress?.[0]?.isCompleted) {
                      return (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-medium text-green-700">
                          <CheckCircle2 size={14} aria-hidden="true" /> Completada
                        </span>
                      );
                    }
                    if (isStuck) {
                      return (
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef2f2] px-3 py-1 text-xs font-medium text-red-700">
                            <AlertTriangle size={14} aria-hidden="true" /> Trabado · 2 intentos
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReleaseStudent(video.id)}
                            disabled={isResetting === video.id}
                            title="Borra los intentos fallidos para que pueda volver a rendir"
                            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 text-xs font-medium text-white transition-colors hover:bg-[#292524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] disabled:opacity-50"
                          >
                            {isResetting === video.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                            Habilitar reintento
                          </button>
                        </div>
                      );
                    }
                    return (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f5f5f4] px-3 py-1 text-xs font-medium text-[#57534e]">
                        <Clock size={14} aria-hidden="true" /> {hasStarted ? "En curso" : "Sin empezar"}
                      </span>
                    );
                  })()}
                </div>

                <div className="space-y-5 p-5">
                  {video.videoReview.map((q: any, qIdx: number) => (
                    <div key={qIdx}>
                      <p className="flex items-start gap-2.5 text-sm font-medium">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-xs text-[#57534e]">{qIdx + 1}</span>
                        {q.question}
                      </p>
                      <div className="ml-7 mt-2 space-y-1.5">
                        {q.examAnswers.map((ans: any, aIdx: number) => (
                          <div
                            key={aIdx}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-sm",
                              ans.isCorrect ? "bg-[#ecfdf5] text-green-800" : "bg-[#fef2f2] text-red-800",
                              ans.isArchived && "opacity-50",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              {ans.isCorrect ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
                              Intento {aIdx + 1}: <span className="font-medium">{ans.response}</span>
                            </span>
                            <span className="shrink-0 text-xs opacity-70">
                              {new Date(ans.createdAt).toLocaleDateString("es-AR")}
                              {ans.isArchived && " · anterior"}
                            </span>
                          </div>
                        ))}
                        {q.examAnswers.length === 0 && <p className="text-sm text-[#a8a29e]">Todavía no respondió esta pregunta.</p>}
                      </div>
                    </div>
                  ))}
                  {video.videoReview.length === 0 && (
                    <p className="py-2 text-center text-sm text-[#a8a29e]">Esta clase no tiene evaluación.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      {/* ── CABECERA ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <label htmlFor="buscar-alumno" className="sr-only">Buscar alumno</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]" size={16} aria-hidden="true" />
          <input
            id="buscar-alumno"
            type="search"
            placeholder="Buscar por nombre, usuario, DNI o teléfono…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-11 w-full rounded-full border border-[#e7e5e4] bg-white pl-11 pr-4 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-1 text-sm text-[#57534e]">
            <span className="font-semibold tabular-nums text-[#0a0a0a]">{localStudents.length}</span>{" "}
            {localStudents.length === 1 ? "alumno" : "alumnos"}
          </span>
          {localStudents.length > 0 && (
            <>
              <button type="button" onClick={handleDownloadPDF} className={btnGhost}>
                <Download size={15} aria-hidden="true" /> Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-red-50 px-4 text-sm font-medium text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 size={15} aria-hidden="true" /> Vaciar curso
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TABLA ── */}
      {filteredStudents.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[#e7e5e4]">
          <table className="w-full min-w-[56rem] border-collapse">
            <thead className="bg-[#fafaf9]">
              <tr className="border-b border-[#e7e5e4]">
                <th scope="col" className={th}>Alumno</th>
                <th scope="col" className={th}>DNI o pasaporte</th>
                <th scope="col" className={th}>Teléfono</th>
                <th scope="col" className={th}>Dirección o ciudad</th>
                <th scope="col" className={th}>Inscripción</th>
                <th scope="col" className={th}>Estado</th>
                <th scope="col" className={`${th} text-right`}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f4]">
              {filteredStudents.map((reg, idx) => {
                const userId = reg.userId || reg?.user?.id;
                const name = reg?.user?.fullName || "Sin nombre";
                const initial = name.charAt(0).toUpperCase();
                return (
                  <tr key={userId || idx} className="transition-colors hover:bg-[#fafaf9]">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-sm font-semibold text-[#C2410C]">
                          {initial}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{name}</p>
                          {reg?.user?.username && <p className="truncate text-xs text-[#57534e]">@{reg.user.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={`${td} tabular-nums`}>{reg?.user?.dni || "—"}</td>
                    <td className={`${td} tabular-nums`}>
                      {reg?.user?.phone ? (
                        <a href={`tel:${reg.user.phone}`} className="hover:text-[#C2410C] hover:underline">
                          {reg.user.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${td} max-w-[14rem] truncate text-[#44403c]`} title={reg?.user?.address || undefined}>
                      {reg?.user?.address || "—"}
                    </td>
                    <td className={`${td} whitespace-nowrap text-[#57534e]`}>{formatDate(reg?.createdAt)}</td>
                    <td className={td}>
                      {updatingRankId === userId ? (
                        <Loader2 className="animate-spin text-[#FF6B00]" size={16} aria-label="Guardando" />
                      ) : (
                        <select
                          aria-label={`Estado de ${name}`}
                          value={reg?.user?.rank || "concurre"}
                          onChange={(e) => handleRankChange(userId, e.target.value)}
                          className={`h-8 cursor-pointer rounded-full border-0 px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                            reg?.user?.rank === "miembro" ? "bg-[#ecfdf5] text-green-700" : "bg-[#f5f5f4] text-[#44403c]"
                          }`}
                        >
                          <option value="concurre">Concurre</option>
                          <option value="miembro">Miembro</option>
                        </select>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleViewHistory(userId, name)}
                          disabled={loadingHistory && activeStudent?.id === userId}
                          aria-label={`Ver progreso de ${name}`}
                          title="Ver progreso"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#f5f5f4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] disabled:opacity-40"
                        >
                          {loadingHistory && activeStudent?.id === userId ? <Loader2 className="animate-spin" size={15} /> : <ChevronRight size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentToDelete(reg)}
                          aria-label={`Quitar a ${name} del curso`}
                          title="Quitar del curso"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#e7e5e4] px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e]">
            <Users size={20} aria-hidden="true" />
          </span>
          <h3 className="mt-3 font-semibold">{filter ? "No hay alumnos con esa búsqueda" : "Todavía no hay alumnos inscriptos"}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[#57534e]">
            {filter ? "Probá con otro nombre, DNI o teléfono." : "Cuando alguien se inscriba con el código de acceso, va a aparecer acá."}
          </p>
        </div>
      )}

        </>
      )}

      {/* ── CONFIRMAR QUITAR / VACIAR ── */}
      <AnimatePresence>
        {(showClearConfirm || studentToDelete) && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowClearConfirm(false); setStudentToDelete(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-quitar-alumno"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-red-700">
                <Trash2 size={22} aria-hidden="true" />
              </span>
              <h2 id="titulo-quitar-alumno" className="mt-4 text-xl font-semibold tracking-[-0.01em]">
                {studentToDelete ? "¿Quitar alumno del curso?" : "¿Vaciar el curso?"}
              </h2>
              <p className="mt-2 text-sm text-[#57534e]">
                {studentToDelete
                  ? `${studentToDelete?.user?.fullName} deja de estar inscripto en este curso.`
                  : "Se quitan todos los alumnos inscriptos. No se puede deshacer."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setShowClearConfirm(false); setStudentToDelete(null); }}
                  disabled={isClearing}
                  className="h-12 rounded-full border border-[#e7e5e4] text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={studentToDelete ? handleDeleteIndividual : handleClearCourse}
                  disabled={isClearing}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-red-700 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {isClearing && <Loader2 className="animate-spin" size={14} aria-hidden="true" />}
                  {studentToDelete ? "Quitar" : "Vaciar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
