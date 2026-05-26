"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Check,
  Clock,
  RefreshCw,
  ChevronRight,
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
import { toast } from "sonner";
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
      const name = reg?.user?.fullName?.toLowerCase() || "";
      const dni = reg?.user?.dni || "";
      return name.includes(filter.toLowerCase()) || dni.includes(filter);
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
      reg?.user?.dni || "Sin DNI",
      reg?.user?.address || "Sin domicilio",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Nombre Completo", "DNI", "Domicilio"]],
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

  return (
    <div className="w-full space-y-6 text-white">
      {/* ── CABECERA ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={15} />
          <input
            type="text"
            placeholder="Buscar alumno o DNI..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 font-medium">{localStudents.length} alumno(s)</span>
          {localStudents.length > 0 && (
            <>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white hover:bg-[#FF6B00] hover:text-black hover:border-[#FF6B00] transition-all rounded-xl text-xs font-bold uppercase tracking-wide">
                <Download size={13} /> <span className="hidden sm:inline">Exportar PDF</span>
              </button>
              <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-xs font-bold uppercase tracking-wide">
                <Trash2 size={13} /> <span className="hidden sm:inline">Vaciar curso</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TABLA ── */}
      {filteredStudents.length > 0 ? (
        <div className="bg-[#0f0f0f] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] border-b border-white/[0.06] px-6 py-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Alumno</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/25 text-center px-8">Estado</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/25 text-center px-4">Historial</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/25 text-right">Acción</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {filteredStudents.map((reg, idx) => {
              const userId = reg.userId || reg?.user?.id;
              const initial = reg?.user?.fullName?.charAt(0)?.toUpperCase() || "?";
              return (
                <motion.div key={userId || idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="grid grid-cols-[1fr_auto_auto_auto] items-center px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center font-black text-[#FF6B00] text-sm shrink-0">{initial}</div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{reg?.user?.fullName || "Sin nombre"}</p>
                      <p className="text-[11px] text-white/25 font-medium mt-0.5">DNI: {reg?.user?.dni || "N/A"}</p>
                    </div>
                  </div>
                  <div className="px-8">
                    {updatingRankId === userId ? <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={16} /> : (
                      <select value={reg?.user?.rank || "concurre"} onChange={(e) => handleRankChange(userId, e.target.value)} className="bg-white/[0.05] border border-white/[0.08] text-[11px] font-bold uppercase tracking-wide text-white/70 rounded-lg px-3 py-2 outline-none focus:border-[#FF6B00]/40 cursor-pointer appearance-none hover:bg-white/[0.08] transition-colors text-center">
                        <option value="concurre" className="bg-[#0f0f0f]">Concurre</option>
                        <option value="miembro" className="bg-[#0f0f0f]">Miembro</option>
                      </select>
                    )}
                  </div>
                  <div className="px-4 text-center">
                    <button onClick={() => handleViewHistory(userId, reg?.user?.fullName || "Usuario")} disabled={loadingHistory && activeStudent?.id === userId} className="w-9 h-9 mx-auto rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/30 hover:bg-[#FF6B00] hover:text-white hover:border-[#FF6B00] transition-all disabled:opacity-40">
                      {loadingHistory && activeStudent?.id === userId ? <Loader2 className="animate-spin" size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button onClick={() => setStudentToDelete(reg)} className="w-9 h-9 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all" title="Eliminar alumno">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-white/[0.08] rounded-2xl">
          <Users size={36} className="mx-auto text-white/10 mb-4" />
          <h3 className="text-base font-black uppercase tracking-widest text-white/25">Sin resultados</h3>
        </div>
      )}

      {/* ── MODALES ── */}
      <AnimatePresence>
        {(showClearConfirm || studentToDelete) && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-[#0f0f0f] border border-white/[0.08] max-w-sm w-full rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trash2 className="text-red-400" size={24} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-2">{studentToDelete ? "¿Eliminar alumno?" : "¿Vaciar curso?"}</h2>
              <p className="text-sm text-white/40 mb-7 leading-relaxed">
                {studentToDelete ? `Estás por eliminar a ${studentToDelete?.user?.fullName} de este curso.` : "Se eliminarán todos los alumnos del curso."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setShowClearConfirm(false); setStudentToDelete(null); }} disabled={isClearing} className="py-3 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] rounded-xl font-bold uppercase text-xs tracking-wide transition-colors">Cancelar</button>
                <button onClick={studentToDelete ? handleDeleteIndividual : handleClearCourse} disabled={isClearing} className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-xs tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isClearing && <Loader2 className="animate-spin" size={13} />} {studentToDelete ? "Eliminar" : "Vaciar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL HISTORIAL ── */}
      <AnimatePresence>
        {selectedHistory && activeStudent && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedHistory(null)} className="absolute inset-0 bg-black/85 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }} className="relative bg-[#0f0f0f] border border-white/[0.08] w-full max-w-4xl h-[88vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-white/[0.06] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center"><User size={20} className="text-[#FF6B00]" /></div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white">Historial del alumno</h3>
                    <p className="text-[11px] text-[#FF6B00]/70 font-bold uppercase tracking-widest mt-0.5">{activeStudent.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedHistory(null)} className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:bg-white/[0.1] hover:text-white transition-all"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedHistory.map((video, vIdx) => (
                  <div key={vIdx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.05]">
                      <div>
                        <span className="text-[10px] font-black text-[#FF6B00]/70 uppercase tracking-widest">Módulo {video.order}</span>
                        <h4 className="text-sm font-bold uppercase tracking-tight text-white mt-0.5">{video.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        {video.videoProgress?.[0]?.isCompleted ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-[11px] font-bold uppercase border border-green-500/20"><CheckCircle2 size={13} /> Completado</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] text-white/30 rounded-lg text-[11px] font-bold uppercase border border-white/[0.07]"><Clock size={13} /> En proceso</div>
                            <button 
                              onClick={() => handleReleaseStudent(video.id)}
                              disabled={isResetting === video.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 rounded-lg text-[11px] font-bold uppercase hover:bg-[#FF6B00] hover:text-black transition-all disabled:opacity-50"
                              title="Permite al alumno reintentar el examen borrando intentos fallidos"
                            >
                              {isResetting === video.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                              Liberar
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SECCIÓN DE PREGUNTAS Y RESPUESTAS */}
                    <div className="p-6 space-y-6 bg-black/20">
                      {video.videoReview.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="space-y-3">
                          <p className="text-xs font-bold text-white/70 flex items-start gap-3">
                            <span className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0 mt-0.5">{qIdx + 1}</span>
                            {q.question}
                          </p>
                          <div className="ml-8 space-y-2">
                            {q.examAnswers.map((ans: any, aIdx: number) => (
                              <div key={aIdx} className={cn(
                                "flex items-center justify-between px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide",
                                ans.isCorrect ? "bg-green-500/5 border-green-500/10 text-green-400" : "bg-red-500/5 border-red-500/10 text-red-400",
                                ans.isArchived && "opacity-40"
                              )}>
                                <div className="flex items-center gap-3">
                                  {ans.isCorrect ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                  <span>Intento {aIdx + 1}: Respuesta <span className="text-white ml-1">{ans.response}</span></span>
                                </div>
                                <span className="text-[9px] opacity-40 font-medium">
                                  {new Date(ans.createdAt).toLocaleDateString()} {ans.isArchived && "• HISTORIAL"}
                                </span>
                              </div>
                            ))}
                            {q.examAnswers.length === 0 && (
                              <p className="text-[10px] text-white/20 italic ml-1">El alumno aún no ha intentado esta pregunta.</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {video.videoReview.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 text-white/10">
                          <Clock size={24} className="mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sin evaluación configurada</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
