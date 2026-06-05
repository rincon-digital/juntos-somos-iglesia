"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, X, ArrowRight, MessageSquareQuote } from "lucide-react";
import { getTestimonies } from "@/actions/testimony/testimony";

interface TestimoniosProps {
  onModalChange?: (isOpen: boolean) => void;
  limit?: number;
}

export default function TestimoniosSection({
  onModalChange,
  limit,
}: TestimoniosProps) {
  const [testimonios, setTestimonios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTestimonio, setSelectedTestimonio] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getTestimonies(limit);
        setTestimonios(data || []);
      } catch (error) {
        console.error("Error al cargar testimonios:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [limit]);

  useEffect(() => {
    const isModalOpen = !!selectedTestimonio;
    if (onModalChange) onModalChange(isModalOpen);

    if (isModalOpen) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };
  }, [selectedTestimonio, onModalChange]);

  return (
    <section className="relative w-full py-24 md:py-32 px-4 md:px-10 overflow-hidden bg-[#050505] z-20">
      {/* CONTENIDO DE TESTIMONIOS */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[...Array(limit || 3)].map((_, i) => (
            <div
              key={i}
              className="h-[350px] bg-white/[0.02] border border-white/5 rounded-[3rem] animate-pulse"
            />
          ))}
        </div>
      ) : testimonios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonios.map((testimonio, index) => (
            <TestimonioCard
              key={testimonio.id}
              testimonio={testimonio}
              index={index}
              onClick={() => setSelectedTestimonio(testimonio)}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 px-6 border border-white/5 bg-white/[0.02] rounded-[3rem] text-center"
        >
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <MessageSquareQuote size={40} className="text-white/20" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tighter">
            Próximamente más experiencias
          </h3>
          <p className="text-white/40 max-w-sm text-sm font-medium">
            Aún no hay testimonios, vuelve pronto para leer lo que Dios está
            haciendo en la vida de nuestros hermanos.
          </p>
        </motion.div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {selectedTestimonio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTestimonio(null)}
            // FIX: eliminado backdrop-blur-sm → causa GPU glitch en Mali (A13/A14)
            // Compensado con mayor opacidad: bg-black/80 → bg-black/90
            className="fixed inset-0 z-[5000] bg-black/90 flex items-center justify-center p-4 sm:p-6 md:p-12 overscroll-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <button
                onClick={() => setSelectedTestimonio(null)}
                // FIX: eliminado backdrop-blur-md → mismo problema de GPU
                // Reemplazado con bg-[#1a1a1a] sólido
                className="absolute top-6 right-6 z-[6000] w-10 h-10 bg-[#1a1a1a] hover:bg-[#FF6B00] border border-white/10 rounded-full flex items-center justify-center transition-all duration-300 group"
              >
                <X
                  size={20}
                  className="text-white group-hover:scale-110 transition-transform"
                />
              </button>

              <div
                className="p-8 sm:p-12 overflow-y-auto custom-scrollbar relative flex-1 overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <Quote className="text-white/5 w-24 h-24 absolute top-8 right-8 -rotate-12 pointer-events-none" />

                <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/10 pr-12">
                  <div className="w-20 h-20 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 flex items-center justify-center font-black text-[#FF6B00] text-3xl uppercase shrink-0">
                    {selectedTestimonio.author?.fullName?.charAt(0) || "F"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-1">
                      {selectedTestimonio.author?.fullName || "Fiel"}
                    </h3>
                    <p className="text-[10px] text-[#FF6B00] font-black tracking-[0.3em] uppercase">
                      {selectedTestimonio.author?.rank || "Congregante"}
                    </p>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none relative z-10">
                  <p className="text-white/80 text-lg md:text-xl leading-relaxed font-light italic whitespace-pre-wrap selection:bg-[#FF6B00] selection:text-white">
                    "{selectedTestimonio.content}"
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function TestimonioCard({ testimonio, index, onClick }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      // FIX: eliminado shadow-2xl → puede forzar compositing layer en Mali GPU
      className="relative group cursor-pointer bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden hover:bg-white/[0.04] hover:border-[#FF6B00]/30 transition-all duration-500 flex flex-col h-[350px]"
      onClick={onClick}
    >
      <div className="p-8 md:p-10 flex flex-col h-full relative z-10">
        <Quote className="absolute top-8 right-8 text-white/[0.03] w-20 h-20 group-hover:text-[#FF6B00]/10 transition-colors duration-500 rotate-12 pointer-events-none" />
        <div className="mb-6 flex-1 overflow-hidden">
          <p className="text-lg font-medium text-white/80 italic leading-relaxed line-clamp-4 group-hover:text-white transition-colors">
            "{testimonio.content}"
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-[#FF6B00] transition-colors mb-6">
          Leer Testimonio Completo{" "}
          <ArrowRight
            size={14}
            className="group-hover:translate-x-2 transition-transform"
          />
        </div>
        <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-auto">
          {/* FIX: reemplazado bg-gradient-to-br con color sólido equivalente */}
          <div className="w-12 h-12 rounded-full bg-[#FF6B00]/20 border border-white/10 flex items-center justify-center font-black text-[#FF6B00] text-lg uppercase shrink-0">
            {testimonio.author?.fullName?.charAt(0) || "F"}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold tracking-widest uppercase text-white truncate">
              {testimonio.author?.fullName || "Fiel"}
            </h4>
            <p className="text-[9px] text-[#FF6B00] font-black tracking-[0.2em] uppercase mt-1 truncate">
              {testimonio.author?.rank || "Congregante"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
