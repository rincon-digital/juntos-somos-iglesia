"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { X, ArrowUpRight, CalendarDays } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PredicaItem {
  dia: string;
  titulo: string;
  detalle: string;
  horario?: string;
  nota?: string;
}

const PREDICAS_LISTA: PredicaItem[] = [
  {
    dia: "Lunes",
    titulo: "Ayuno",
    detalle: "Comienza tu semana en búsqueda espiritual.",
    horario: "07:00 AM",
  },
  {
    dia: "Martes",
    titulo: "Milagros de Jesucristo",
    detalle: "Oramos por tus necesidades creyendo en milagros.",
    horario: "07:00 AM y 19:30 HS",
  },
  {
    dia: "Miércoles",
    titulo: "Milagros Urgentes",
    detalle: "Nada es imposible para Dios. Una oración de fe puede cambiarlo todo hoy.",
    horario: "07:00 AM y 19:30 HS",
  },
  {
    dia: "Jueves",
    titulo: "Y todos fueron llenos del Espíritu Santo",
    detalle: "Buscando la llenura y presencia del Espíritu Santo.",
    horario: "07:00 AM y 19:30 HS",
  },
  {
    dia: "Viernes",
    titulo: "Rompiendo Cadenas",
    detalle: "Rompemos toda atadura espiritual en el nombre de Jesús.",
    horario: "07:00 AM y 19:30 HS",
  },
  {
    dia: "Sábado",
    titulo: "Legacy",
    detalle: "Grupo de Jovenes & Las Hormiguitas",
    horario: "15:00 HS - 17:00 HS",
    nota: "Primer horario para los jovenes y el segundo para los niños",
  },
  {
    dia: "Domingo",
    titulo: "Gran Liberación",
    detalle: "Un tiempo de victoria para toda tu familia. Liberación total.",
    horario: "19:30 HS",
  },
];

interface PredicasProps {
  onModalChange?: (isOpen: boolean) => void;
}

export default function Predicas({ onModalChange }: PredicasProps) {
  const [selected, setSelected] = useState<PredicaItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (onModalChange) {
      onModalChange(selected !== null);
    }
  }, [selected, onModalChange]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".predicas-header",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".list-item",
        { opacity: 0, x: -15 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            once: true,
          },
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="predicas"
      className="relative py-10 md:py-10 bg-[#050505] text-white px-6"
    >
      <div className="max-w-6xl mx-auto">
        <header className="predicas-header mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 opacity-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-[#FF6B00]" size={14} />
              <span className="text-[#FF6B00] font-mono text-[9px] tracking-[0.3em] uppercase font-black">
                Cronograma
              </span>
            </div>
            <h2 className="text-[10vw] md:text-[5vw] font-black uppercase leading-none tracking-tighter italic text-white">
              PASOS DE FE
            </h2>
          </div>
          <div className="max-w-[240px] border-l border-[#FF6B00] pl-4 py-1">
            <p className="text-[11px] md:text-xs text-white/40 uppercase font-bold italic leading-tight">
              Siete días de poder espiritual diseñados para tu transformación.
            </p>
          </div>
        </header>

        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 border-t border-white/5"
        >
          {PREDICAS_LISTA.map((item, index) => (
            <article
              key={index}
              onClick={() => setSelected(item)}
              className={`list-item opacity-0 group relative border-b border-white/5 py-6 md:py-8 cursor-pointer transition-all duration-500 hover:bg-[#FF6B00]/5 hover:px-4 ${
                item.dia === "Domingo"
                  ? "lg:col-span-2 bg-gradient-to-r from-transparent via-[#FF6B00]/5 to-transparent"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="text-[#FF6B00] font-mono text-[10px] font-black opacity-30 group-hover:opacity-100">
                    0{index + 1}
                  </span>
                  <div>
                    <span className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-1 group-hover:text-[#FF6B00]">
                      {item.dia}
                    </span>
                    <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic transition-all">
                      {item.titulo}
                    </h3>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#FF6B00] group-hover:border-[#FF6B00] transition-all">
                  <ArrowUpRight className="w-4 h-4 group-hover:text-black transition-colors" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* MODAL AJUSTADO CON HORARIO CONDICIONAL */}
      {mounted &&
        selected &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setSelected(null)}
            />
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-6 right-6 text-white/20 hover:text-[#FF6B00] transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-6">
                <div>
                  <p className="text-[#FF6B00] font-mono text-[9px] tracking-[0.4em] uppercase font-black mb-1">
                    // {selected.dia}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                    {selected.titulo}
                  </h2>
                </div>
                <div className="h-px w-12 bg-[#FF6B00]" />
                <p className="text-sm md:text-base text-white/60 italic leading-relaxed">
                  "{selected.detalle}"
                </p>

                {/* Renderizado dinámico de la info inferior */}
                <div
                  className={`grid gap-3 pt-4 ${selected.horario ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {selected.horario && (
                    <div className="bg-white/5 p-4 rounded-2xl">
                      <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">
                        Horario
                      </p>
                      <p className="text-lg font-black italic">
                        {selected.horario}
                      </p>
                    </div>
                  )}
                  <div className="bg-white/5 p-4 rounded-2xl border-l-2 border-[#FF6B00]">
                    <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">
                      Lugar
                    </p>
                    <p className="text-lg font-black italic">
                      {selected.dia === "Lunes"
                        ? "En el Hogar"
                        : "Sargento Cabral 844"}
                    </p>
                  </div>
                </div>

                {selected.nota && (
                  <p className="text-[9px] font-black uppercase text-[#FF6B00]/60 tracking-tighter text-center">
                    * {selected.nota}
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}


    </section>
  );
}
