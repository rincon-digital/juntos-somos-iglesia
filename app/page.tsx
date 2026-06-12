"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Predicas from "@/components/Predicas";
import Cursos from "@/components/Cursos";
import Ubicacion from "@/components/Ubicacion";
import Articulos from "@/components/Articulos";
import TestimoniosSection from "@/components/TestimoniosSection";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/actions/auth/auth";
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.to(".main-content", { opacity: 1, duration: 0.5 })
        .from(".hero-text", {
          y: 100,
          skewY: 7,
          opacity: 0,
          duration: 1.5,
          stagger: 0.2,
        })
        .from(
          ".glass-card",
          {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
          },
          "-=1",
        );

      gsap.to(".hero-img", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-container",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading]);

  return (
    <main
      ref={containerRef}
      className="bg-[#050505] text-white min-h-screen selection:bg-[#FF6B00] selection:text-black"
    >
      <SmoothScroll />

      {/* PANTALLA DE CARGA */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center">
          <h2 className="text-[#FF6B00] font-black italic tracking-[0.5em] animate-pulse text-xs">
            CARGANDO EXPERIENCIA...
          </h2>
          <div className="w-40 h-[1px] bg-white/10 mt-4 overflow-hidden">
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
        <section className="hero-container relative h-screen w-full flex items-center justify-center overflow-hidden p-4 md:p-10">
          <div className="relative w-full h-full rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src="/iglesia.webp"
              alt="Iglesia Principal"
              fill
              className="hero-img object-cover brightness-[0.3] scale-110"
              priority
            />

            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-20 pointer-events-none">
              <h1 className="flex flex-col">
                <span className="hero-text text-[16vw] md:text-[11vw] font-black uppercase leading-[0.75] tracking-tighter italic">
                  JUNTOS
                </span>
                <span className="hero-text text-[16vw] md:text-[11vw] font-black uppercase leading-[0.75] tracking-tighter text-[#FF6B00] self-center py-2">
                  SOMOS
                </span>
                <span className="hero-text text-[16vw] md:text-[11vw] font-black uppercase leading-[0.75] tracking-tighter italic self-end">
                  IGLESIA
                </span>
              </h1>
            </div>

            {/* TARJETAS RESPONSIVAS */}
            <div className="glass-card absolute top-10 right-10 hidden lg:flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-full px-6 z-30">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#FF6B00]">
                <Image
                  src="/pastor.webp"
                  alt="Pastor"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold uppercase tracking-tighter">
                  Ageu da Rosa
                </h2>
                <p className="text-[10px] text-[#FF6B00] font-black uppercase">
                  Pastor Principal
                </p>
              </div>
            </div>

            <div className="glass-card absolute bottom-10 left-6 md:left-10 bg-[#050505]/95 md:bg-black/40 backdrop-blur-none md:backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] max-w-sm z-30 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Próxima Cita
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-2 leading-none">
                Martes a Viernes
              </h3>
              <p className="text-[#FF6B00] font-mono text-2xl font-bold italic">
                19:00 — 21:30 HS
              </p>
            </div>
          </div>
        </section>

        {/* SECCIONES */}
        <div className="relative z-20 bg-[#050505]">
          <Predicas />

          <div>
            <Cursos limit={4} onModalChange={setIsModalOpen} />
          </div>

          <div>
            <TestimoniosSection limit={3} onModalChange={setIsModalOpen} />

            {/* Botón Ver Más (Solo visible si no hay modal abierto) */}
            {!isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="max-w-7xl mx-auto px-6 pb-20 flex justify-center md:justify-end"
              >
                <Link
                  href="/testimonios"
                  className="group flex items-center gap-4 bg-white/[0.02] hover:bg-[#FF6B00] border border-white/5 hover:border-[#FF6B00] px-8 py-4 rounded-2xl transition-all duration-500"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                    Explorar todos los testimonios
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <ArrowUpRight size={16} className="text-white" />
                  </div>
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
                className="max-w-7xl mx-auto px-6 pb-20 flex justify-center md:justify-end"
              >
                <Link
                  href="/articulos"
                  className="group flex items-center gap-4 bg-white/[0.02] hover:bg-[#FF6B00] border border-white/5 hover:border-[#FF6B00] px-8 py-4 rounded-2xl transition-all duration-500"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                    Explorar todo el blog
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <ArrowUpRight size={16} className="text-white" />
                  </div>
                </Link>
              </motion.div>
            )}
          </div>

          <Ubicacion />

          <footer className="py-20 text-center border-t border-white/5 text-[10px] font-black tracking-[0.3em] uppercase text-white/20">
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
