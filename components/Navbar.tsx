"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { Menu, X, User } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const menuItems = [
  { name: "Inicio", href: "/", section: null },
  { name: "Prédicas", href: "/#predicas", section: "predicas" },
  { name: "Cursos", href: "/#cursos", section: "cursos" },
  { name: "Artículos", href: "/#articulos", section: "articulos" },
  { name: "Ubicación", href: "/#ubicacion", section: "ubicacion" },
];

// Secciones de la portada que se marcan al pasar por ellas (el hero cuenta como Inicio)
const TRACKED = ["cursos", "articulos", "ubicacion"];

export default function Navbar() {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (pathname !== "/") return;
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const id of TRACKED) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveSection(current);
    };

    handleScroll();

    gsap.fromTo(
      containerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
    );

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const isActive = (item: (typeof menuItems)[number]) => {
    if (pathname === "/") return item.section === activeSection || (!activeSection && item.section === null);
    if (item.section === "cursos") return pathname.startsWith("/cursos");
    if (item.section === "articulos") return pathname.startsWith("/articulos");
    return false;
  };

  return (
    <header
      ref={containerRef}
      className={`fixed top-0 left-0 z-[100] flex w-full justify-center px-4 transition-[padding] duration-500 font-[family-name:var(--font-poppins)] ${
        isScrolled ? "pt-2" : "pt-6"
      }`}
    >
      <nav
        aria-label="Navegación principal"
        className={`relative flex w-full min-w-max items-center justify-between gap-4 lg:gap-8 transition-all duration-500 ${
          isScrolled ? "max-w-[60rem] rounded-full py-2 pl-3 pr-2" : "max-w-5xl rounded-[2rem] py-3 pl-4 pr-3 md:rounded-full"
        }`}
      >
        {/* VIDRIO: va aparte porque backdrop-filter en el nav encerraría al menú móvil */}
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-[inherit] border border-white/70 bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:bg-white/55 md:backdrop-blur-xl md:backdrop-saturate-150"
        />

        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00]">
            <Image src="/Logo.webp" alt="" width={22} height={22} className="brightness-0 invert" />
          </span>
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] text-[#0a0a0a]">
            Juntos Somos Iglesia
          </span>
        </Link>

        {/* MENU ESCRITORIO */}
        <ul className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-10 items-center rounded-full px-4 text-[15px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                    active ? "text-[#0a0a0a]" : "text-[#57534e] hover:bg-black/[0.04] hover:text-[#0a0a0a]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-publico-activo"
                      className="absolute inset-0 -z-10 rounded-full bg-[#f5f5f4] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                    />
                  )}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ACCIONES */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            aria-label="Ingresar"
            className="flex h-10 w-10 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-[15px] font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 sm:w-auto sm:px-5"
          >
            <User size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Ingresar</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
              isOpen ? "bg-[#0a0a0a] text-white" : "bg-black/5 text-[#0a0a0a]"
            }`}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* MENÚ MÓVIL */}
        {isOpen && (
          <div className="absolute inset-x-0 top-full mt-3 flex flex-col gap-1 rounded-[2rem] border border-[#e7e5e4] bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] lg:hidden">
            {menuItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl px-4 py-3 text-lg font-medium transition-colors ${
                    active ? "bg-[#f5f5f4] text-[#0a0a0a]" : "text-[#44403c] hover:bg-[#f5f5f4]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-[15px] font-medium text-white"
            >
              <User size={16} aria-hidden="true" />
              Ingresar
            </Link>
          </div>
        )}
      </nav>

      <style jsx global>{`
        body:has(.fixed.inset-0.z-\\[1000\\]),
        body:has(.fixed.inset-0.z-\\[2000\\]) {
          header {
            z-index: 10 !important;
            opacity: 0.1;
            pointer-events: none;
          }
        }
      `}</style>
    </header>
  );
}
