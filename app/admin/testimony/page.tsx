"use client";
import { useEffect, useState } from "react";
import {
  Trash2,
  Quote,
  Loader2,
  Clock,
  Search,
  X,
  AlertTriangle,
  MessageSquareQuote,
} from "lucide-react";
import {
  getTestimonies,
  adminDeleteTestimony,
} from "@/actions/testimony/testimony";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
        setTestimonies((prev) =>
          prev.filter((t) => t.id !== testimonyToDelete.id),
        );
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
    <div className="w-full space-y-6 relative">
      {/* ── CABECERA ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Testimonios
          </h2>
          <p className="text-xs text-white/30 font-medium mt-0.5">
            {testimonies.length} registro{testimonies.length !== 1 ? "s" : ""}{" "}
            en el sistema
          </p>
        </div>
        <div className="relative w-full sm:w-72 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors"
            size={15}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/40 transition-all"
          />
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-52 bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.05]"
              />
            ))
          ) : filteredTestimonies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center border border-dashed border-white/[0.07] rounded-2xl"
            >
              <MessageSquareQuote
                size={32}
                className="mx-auto text-white/10 mb-3"
              />
              <p className="text-sm font-bold uppercase tracking-widest text-white/20">
                Sin resultados
              </p>
            </motion.div>
          ) : (
            filteredTestimonies.map((t, i) => (
              <motion.div
                layout
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-[#0f0f0f] border border-white/[0.07] hover:border-[#FF6B00]/25 rounded-2xl overflow-hidden flex flex-col transition-all"
              >
                {/* Cuerpo */}
                <div
                  className="p-5 flex-1 cursor-pointer"
                  onClick={() => setTestimonyToRead(t)}
                >
                  {/* Autor */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center font-black text-[#FF6B00] text-sm shrink-0">
                      {t.author?.fullName?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate leading-tight">
                        {t.author?.fullName || "Anónimo"}
                      </p>
                      <span className="text-[10px] text-[#FF6B00]/60 font-bold uppercase tracking-wide">
                        {t.author?.rank || "Fiel"}
                      </span>
                    </div>
                    <Quote
                      className="ml-auto text-white/[0.06] group-hover:text-[#FF6B00]/10 transition-colors shrink-0"
                      size={28}
                    />
                  </div>

                  {/* Texto */}
                  <p className="text-sm text-white/50 leading-relaxed italic line-clamp-3 group-hover:text-white/70 transition-colors">
                    "{t.content}"
                  </p>

                  {/* Fecha */}
                  <div className="flex items-center gap-1.5 mt-4 text-[10px] text-white/20">
                    <Clock size={10} />
                    {new Date(t.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.05] grid grid-cols-2">
                  <button
                    onClick={() => setTestimonyToRead(t)}
                    className="py-3 text-[11px] font-bold text-white/25 hover:text-white hover:bg-white/[0.04] transition-all uppercase tracking-wide border-r border-white/[0.05]"
                  >
                    Leer màs...
                  </button>
                  <button
                    onClick={() => setTestimonyToDelete(t)}
                    className="py-3 text-[11px] font-bold text-red-500/30 hover:text-white hover:bg-red-500 transition-all uppercase tracking-wide flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── MODAL LECTURA ── */}
      <AnimatePresence>
        {testimonyToRead && (
          <div className="fixed inset-0 z-[5500] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTestimonyToRead(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-[#0f0f0f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center font-black text-[#FF6B00] text-base">
                    {testimonyToRead.author?.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-tight">
                      {testimonyToRead.author?.fullName || "Anónimo"}
                    </p>
                    <p className="text-[10px] text-[#FF6B00]/60 font-bold uppercase tracking-widest">
                      {testimonyToRead.author?.rank || "Fiel"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTestimonyToRead(null)}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 overflow-y-auto flex-1">
                <Quote className="text-[#FF6B00]/10 mb-4" size={32} />
                <p className="text-white/75 text-base md:text-lg leading-relaxed italic whitespace-pre-wrap">
                  {testimonyToRead.content}
                </p>
                <div className="flex items-center gap-2 mt-6 text-[11px] text-white/20 font-medium">
                  <Clock size={11} />
                  Publicado el{" "}
                  {new Date(testimonyToRead.createdAt).toLocaleDateString(
                    "es-AR",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.06] p-4 shrink-0">
                <button
                  onClick={() => {
                    setTestimonyToRead(null);
                    setTestimonyToDelete(testimonyToRead);
                  }}
                  className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  <Trash2 size={13} /> Eliminar testimonio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CONFIRMACIÓN BORRADO ── */}
      <AnimatePresence>
        {testimonyToDelete && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTestimonyToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-8 text-center shadow-2xl"
            >
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                ¿Eliminar testimonio?
              </h3>
              <p className="text-sm text-white/35 mb-6 leading-relaxed">
                Esta acción es permanente. El testimonio será removido de la
                plataforma.
              </p>

              {/* Preview del testimonio a eliminar */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 mb-6 text-left">
                <p className="text-xs font-bold text-white/50 truncate">
                  {testimonyToDelete.author?.fullName}
                </p>
                <p className="text-xs text-white/25 italic line-clamp-2 mt-0.5">
                  "{testimonyToDelete.content}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTestimonyToDelete(null)}
                  className="py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white font-bold uppercase text-xs tracking-wide transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={!!deletingId}
                  className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold uppercase text-xs tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {deletingId ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
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
