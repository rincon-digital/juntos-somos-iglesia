"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import { PREDICAS_LISTA } from "@/components/Predicas";
import Cursos from "@/components/Cursos";
import Ubicacion from "@/components/Ubicacion";
import Articulos from "@/components/Articulos";
import TestimoniosSection from "@/components/TestimoniosSection";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/actions/auth/auth";
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Ángulo de cada tarjeta del hero, de Lunes a Domingo
const ARC_ANGLES = [-72, -48, -24, 0, 24, 48, 72];

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayIndex, setTodayIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // getDay() arranca en domingo; la lista arranca en lunes
    const index = (new Date().getDay() + 6) % 7;
    setTodayIndex(index);

    const arc = arcRef.current;
    const card = arc?.children[index] as HTMLElement | undefined;
    if (arc && card && window.innerWidth < 1024) {
      arc.scrollLeft =
        card.offsetLeft - (arc.clientWidth - card.offsetWidth) / 2;
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".hero-copy > *", {
        y: 16,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        delay: 0.2,
        ease: "power3.out",
      });
    });

    // Las siete tarjetas nacen juntas arriba y se abren en arco
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.utils
        .toArray<HTMLElement>(".hero-arc-item")
        .forEach((item, i) => {
          gsap.fromTo(
            item,
            { "--a": "0deg" },
            { "--a": `${ARC_ANGLES[i]}deg`, duration: 1.1, ease: "expo.out" },
          );
        });
    });

    return () => mm.revert();
  }, [isLoading]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.stop();
      }
    } else {
      document.body.style.overflow = "";
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.start();
      }
    }
    return () => {
      document.body.style.overflow = "";
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.start();
      }
    };
  }, [isModalOpen]);

  return (
    <main
      ref={containerRef}
      className="bg-white text-[#0a0a0a] min-h-screen selection:bg-[#FF6B00] selection:text-black"
    >
      <SmoothScroll />

      {/* PANTALLA DE CARGA */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
          <h2 className="text-[#FF6B00] font-black italic tracking-[0.5em] animate-pulse text-xs">
            CARGANDO EXPERIENCIA...
          </h2>
          <div className="w-40 h-[1px] bg-black/10 mt-4 overflow-hidden">
            <div className="w-full h-full bg-[#FF6B00] origin-left animate-loading-bar" />
          </div>
        </div>
      )}

      <div
        className={`main-content ${isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-1000"}`}
      >
        {/* --- NAVBAR DINÁMICO --- */}
        <AnimatePresence>
          {!isModalOpen && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 right-0 z-[100]"
            >
              <Navbar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- HERO SECTION --- */}
        <section
          id="predicas"
          className="hero-stage relative w-full overflow-hidden bg-white text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
          <div className="hero-copy relative z-10 mx-auto flex max-w-xl flex-col items-center px-6 pt-32 text-center">
            <h1 className="hero-title text-5xl font-semibold leading-[1.1] tracking-[-0.03em]">
              Juntos Somos
              <br />
              Iglesia
            </h1>
            <p className="mt-4 text-base text-[#57534e]">
              Siete días de fe en Formosa. Te estamos esperando.
            </p>
            <Link
              href="/#ubicacion"
              className="hero-card mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#FF6B00] px-7 text-sm font-semibold text-black outline-none hover:bg-[#ff7f24] focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Cómo llegar
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <dl className="mt-8 grid w-full grid-cols-1 gap-4 text-center text-sm sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#e7e5e4] lg:w-[640px]">
              <div className="px-4">
                <dt className="text-[#57534e]">Pastor</dt>
                <dd className="mt-1 flex items-center justify-center gap-2 font-medium">
                  <Image
                    src="/pastor.webp"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  Ageu da Rosa
                </dd>
              </div>
              <div className="px-4">
                <dt className="text-[#57534e]">Dirección</dt>
                <dd className="mt-1 font-medium">Av. Juan B. Cabral 844</dd>
              </div>
              <div className="px-4">
                <dt className="text-[#57534e]">Entrada</dt>
                <dd className="mt-1 font-medium">Libre y gratuita</dd>
              </div>
            </dl>
          </div>

          <ul ref={arcRef} className="hero-arc" aria-label="Pasos de fe de la semana">
            {PREDICAS_LISTA.map((item, i) => {
              const isToday = i === todayIndex;
              return (
                <li
                  key={item.dia}
                  className="hero-arc-item"
                  style={{ "--a": `${ARC_ANGLES[i]}deg` } as React.CSSProperties}
                >
                  <div
                    aria-current={isToday ? "date" : undefined}
                    className={`flex h-full flex-col rounded-[1.75rem] p-4 text-left shadow-[0_12px_30px_rgba(0,0,0,0.14)] ${
                      isToday
                        ? "bg-[#FF6B00] text-black"
                        : "bg-[#0a0a0a] text-white"
                    }`}
                  >
                    <span className="flex items-center justify-between text-sm font-medium">
                      {item.dia}
                      {isToday && (
                        <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                          Hoy
                        </span>
                      )}
                    </span>
                    <span className="mt-auto text-[15px] font-semibold leading-snug">
                      {item.titulo}
                    </span>
                    <span
                      className={`mt-2 text-xs ${isToday ? "text-black" : "text-white/70"}`}
                    >
                      {item.horario}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* SECCIONES */}
        <div className="relative z-20 bg-white">
          <div>
            <Cursos limit={2} onModalChange={setIsModalOpen} />
          </div>

          <div>
            <TestimoniosSection limit={3} onModalChange={setIsModalOpen} />

            {/* Botón Ver Más (Solo visible si no hay modal abierto) */}
            {!isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="mx-auto flex max-w-6xl justify-center px-6 pb-20 md:justify-start font-[family-name:var(--font-poppins)]"
              >
                <Link
                  href="/testimonios"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#e7e5e4] px-6 text-sm font-medium text-[#0a0a0a] transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  Ver todos los testimonios
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* --- SECCIÓN ARTÍCULOS CON LÍMITE --- */}
          <div>
            <Articulos onModalChange={setIsModalOpen} limit={3} />

            {/* Botón Ver Más (Solo visible si no hay modal abierto) */}
            {!isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="mx-auto flex max-w-6xl justify-center px-6 pb-20 md:justify-start font-[family-name:var(--font-poppins)]"
              >
                <Link
                  href="/articulos"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#e7e5e4] px-6 text-sm font-medium text-[#0a0a0a] transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  Ver todos los artículos
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </motion.div>
            )}
          </div>

          <Ubicacion />

          <footer className="py-20 text-center border-t border-[#e7e5e4] text-[10px] font-black tracking-[0.3em] uppercase text-[#57534e]">
            © {new Date().getFullYear()} JUNTOS SOMOS IGLESIA — DIGITALIZA TU
            PASIÓN
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        html.lenis,
        html.lenis body {
          height: auto;
        }
        .lenis.lenis-smooth {
          scroll-behavior: auto !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>
    </main>
  );
}
