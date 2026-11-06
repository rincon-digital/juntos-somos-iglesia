"use client";
import { useEffect, useState } from "react";
import { Trash2, Loader2, Search, X, AlertTriangle } from "lucide-react";
import {
  getTestimonies,
  adminDeleteTestimony,
} from "@/actions/testimony/testimony";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";

const RANK_LABEL: Record<string, string> = { miembro: "Miembro", concurre: "Concurre" };
const LONG_TEXT = 280;

const formatDate = (d: string, month: "short" | "long" = "short") =>
  new Date(d).toLocaleDateString("es-AR", { day: "numeric", month, year: "numeric" });

const pillButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-[transform,background-color,border-color] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2";

function Avatar({ name }: { name?: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] font-semibold text-[#C2410C]">
      {name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );
}

export default function TestimonyPage() {
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testimonyToDelete, setTestimonyToDelete] = useState<any | null>(null);
  const [testimonyToRead, setTestimonyToRead] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      const data = await getTestimonies();
      setTestimonies(data || []);
    } catch {
      toast.error("Error al cargar testimonios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const confirmDelete = async () => {
    if (!testimonyToDelete) return;
    setDeletingId(testimonyToDelete.id);
    try {
      const res = await adminDeleteTestimony(testimonyToDelete.id);
      if (res.success) {
        toast.success("Testimonio eliminado");
        setTestimonies((prev) => prev.filter((t) => t.id !== testimonyToDelete.id));
        setTestimonyToDelete(null);
      }
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTestimonies = testimonies.filter(
    (t) =>
      t.author?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 py-2 text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Testimonios</h1>
          <p className="mt-1 text-[#57534e]">
            {testimonies.length} {testimonies.length === 1 ? "testimonio publicado" : "testimonios publicados"} en la web.
          </p>
        </div>
        <div className="relative w-80">
          <label htmlFor="buscar-testimonio" className="sr-only">Buscar testimonio</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]" size={16} aria-hidden="true" />
          <input
            id="buscar-testimonio"
            type="search"
            placeholder="Buscar por nombre o texto…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-full border border-[#e7e5e4] bg-white pl-11 pr-4 text-sm outline-none transition-[border-color,box-shadow] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
          />
        </div>
      </header>

      {loading ? (
        <div className="columns-3 gap-5" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-5 h-44 break-inside-avoid animate-pulse rounded-[1.75rem] bg-[#f5f5f4]" />
          ))}
        </div>
      ) : filteredTestimonies.length === 0 ? (
        <div className="rounded-[1.75rem] border border-[#e7e5e4] bg-white px-6 py-16 text-center">
          <p className="font-semibold">{searchQuery ? "No hay testimonios que coincidan" : "Todavía no hay testimonios"}</p>
          <p className="mt-1 text-sm text-[#57534e]">
            {searchQuery ? "Probá con otro nombre o palabra." : "Los alumnos los comparten desde su panel."}
          </p>
        </div>
      ) : (
        <div className="columns-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredTestimonies.map((t, i) => {
              const isLong = (t.content?.length || 0) > LONG_TEXT;
              return (
                <motion.article
                  layout
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                  className="mb-5 break-inside-avoid rounded-[1.75rem] border border-[#e7e5e4] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={t.author?.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{t.author?.fullName || "Anónimo"}</p>
                      <p className="text-sm text-[#57534e]">
                        {RANK_LABEL[t.author?.rank] || "Hermano"} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className={`mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[#44403c] ${isLong ? "line-clamp-5" : ""}`}>
                    {t.content}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#e7e5e4] pt-3">
                    {isLong ? (
                      <button
                        type="button"
                        onClick={() => setTestimonyToRead(t)}
                        className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                      >
                        Leer completo
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => setTestimonyToDelete(t)}
                      aria-label={`Eliminar testimonio de ${t.author?.fullName || "Anónimo"}`}
                      title="Eliminar"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[#57534e] transition-colors hover:bg-[#fef2f2] hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── LECTURA ── */}
      <AnimatePresence>
        {testimonyToRead && (
          <div key="leer-testimonio" className="fixed inset-0 z-[5500] flex items-center justify-center p-6 font-[family-name:var(--font-poppins)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTestimonyToRead(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-leer-testimonio"
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-white text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-[#e7e5e4] px-6 py-5">
                <div className="flex items-center gap-3">
                  <Avatar name={testimonyToRead.author?.fullName} />
                  <div>
                    <p id="titulo-leer-testimonio" className="font-semibold">{testimonyToRead.author?.fullName || "Anónimo"}</p>
                    <p className="text-sm text-[#57534e]">
                      {RANK_LABEL[testimonyToRead.author?.rank] || "Hermano"} · {formatDate(testimonyToRead.createdAt, "long")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTestimonyToRead(null)}
                  aria-label="Cerrar"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e] transition-colors hover:bg-[#e7e5e4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-6">
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-[#44403c]">{testimonyToRead.content}</p>
              </div>
              <div className="border-t border-[#e7e5e4] p-4">
                <button
                  type="button"
                  onClick={() => {
                    setTestimonyToRead(null);
                    setTestimonyToDelete(testimonyToRead);
                  }}
                  className={`${pillButton} w-full border border-[#e7e5e4] text-red-700 hover:border-red-700 hover:bg-[#fef2f2]`}
                >
                  <Trash2 size={16} aria-hidden="true" /> Eliminar testimonio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRMAR ELIMINACIÓN ── */}
      <AnimatePresence>
        {testimonyToDelete && (
          <div key="borrar-testimonio" className="fixed inset-0 z-[6000] flex items-center justify-center p-4 font-[family-name:var(--font-poppins)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTestimonyToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-borrar-testimonio"
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 text-center text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-red-700">
                <AlertTriangle size={24} aria-hidden="true" />
              </span>
              <h3 id="titulo-borrar-testimonio" className="mt-4 text-xl font-semibold tracking-[-0.01em]">¿Eliminar el testimonio?</h3>
              <p className="mt-2 text-sm text-[#57534e]">Deja de verse en la web. No se puede deshacer.</p>
              <div className="mt-5 rounded-2xl bg-[#fafaf9] px-4 py-3 text-left">
                <p className="truncate text-sm font-medium">{testimonyToDelete.author?.fullName}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-[#57534e]">{testimonyToDelete.content}</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setTestimonyToDelete(null)} className={`${pillButton} h-12 border border-[#e7e5e4] hover:bg-[#f5f5f4]`}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={!!deletingId}
                  className={`${pillButton} h-12 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700 disabled:opacity-80`}
                >
                  {deletingId ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
