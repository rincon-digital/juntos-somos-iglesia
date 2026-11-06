"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getTestimonies } from "@/actions/testimony/testimony";

interface TestimoniosProps {
  // Se mantiene por compatibilidad: la sección ya no abre modales
  onModalChange?: (isOpen: boolean) => void;
  limit?: number;
}

export default function TestimoniosSection({ limit }: TestimoniosProps) {
  const [testimonios, setTestimonios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <section className="relative z-20 bg-white px-6 py-24 text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-xl">
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            Vidas transformadas
          </h2>
          <p className="mt-3 text-base text-[#57534e]">
            Lo que Dios está haciendo en la vida de nuestros hermanos, contado por ellos.
          </p>
        </header>

        {isLoading ? (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {[...Array(limit || 3)].map((_, i) => (
              <div
                key={i}
                className="mb-6 h-36 break-inside-avoid animate-pulse rounded-[2rem] bg-[#f5f5f4]"
              />
            ))}
          </div>
        ) : testimonios.length > 0 ? (
          // Cada tarjeta toma el ancho de su contenido, hasta un máximo
          <div className="flex flex-wrap items-start justify-center gap-6">
            {testimonios.map((testimonio, index) => (
              <motion.figure
                key={testimonio.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
                className="w-fit max-w-full [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.12))_drop-shadow(0_14px_28px_rgba(0,0,0,0.16))] sm:max-w-[26rem]"
              >
                {/* El padding lateral reserva lugar para las curvas que unen la pestaña con la tarjeta */}
                <div className="flex justify-center px-11">
                  <figcaption className="testimonio-tab relative rounded-t-[1.25rem] bg-white px-6 pt-3 text-center font-semibold">
                    {testimonio.author?.fullName || "Hermano de la iglesia"}
                  </figcaption>
                </div>
                <blockquote className="whitespace-pre-wrap rounded-[2rem] bg-white px-6 pb-6 pt-3 text-[15px] leading-relaxed text-[#44403c]">
                  {testimonio.content}
                </blockquote>
              </motion.figure>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#e7e5e4] px-6 py-16 text-center">
            <h3 className="text-xl font-semibold">Todavía no hay testimonios</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#57534e]">
              Pronto vas a poder leer lo que Dios está haciendo en la vida de nuestros hermanos.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
