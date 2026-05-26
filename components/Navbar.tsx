"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Menu, X, User } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Navbar() {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Inicio", href: "/" },
    { name: "Prédicas", href: "/#predicas" },
    { name: "Cursos", href: "/cursos" },
    { name: "Articulos", href: "/articulos" },
    { name: "Ubicación", href: "/#ubicacion" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Inicializar estado al montar
    handleScroll();

    gsap.fromTo(
      containerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
    );

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <header
      ref={containerRef}
      className={`fixed top-0 left-0 w-full flex justify-center transition-all duration-500 z-[100] px-4 ${
        isScrolled ? "pt-2" : "pt-6"
      }`}
    >
      <nav
        className={`flex justify-between items-center w-full max-w-5xl bg-black/60 backdrop-blur-xl border border-white/10 transition-all duration-500 shadow-2xl ${
          isScrolled
            ? "px-5 py-2 rounded-full max-w-3xl border-white/20"
            : "px-8 py-4 rounded-[2rem] md:rounded-full"
        }`}
      >
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className={`bg-[#FF6B00] rounded-full flex items-center justify-center transition-all duration-500 ${
              isScrolled ? "w-7 h-7" : "w-10 h-10"
            }`}
          >
            <Image
              src="/Logo.webp"
              alt="Logo"
              width={isScrolled ? 16 : 22}
              height={isScrolled ? 16 : 22}
              className="brightness-0 invert"
            />
          </div>
          <div className="flex flex-col leading-none">
            {!isScrolled && (
              <span className="text-white/40 font-black uppercase text-[8px] tracking-tighter">
                JUNTOS SOMOS
              </span>
            )}
            <span
              className={`text-[#FF6B00] font-black uppercase tracking-tighter italic transition-all ${
                isScrolled ? "text-sm" : "text-lg"
              }`}
            >
              IGLESIA
            </span>
          </div>
        </Link>

        {/* MENU DESKTOP */}
        <div className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-4 py-2 text-white/50 hover:text-white transition-all font-bold uppercase tracking-[0.2em] ${
                isScrolled ? "text-[8px]" : "text-[10px]"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* ACCIONES */}
        <div className="flex items-center gap-2">
          <Link
            href="/login-estudiante"
            className={`flex items-center gap-2 bg-white text-black rounded-full font-black uppercase tracking-widest transition-all hover:bg-[#FF6B00] hover:text-white ${
              isScrolled ? "px-4 py-1.5 text-[8px]" : "px-6 py-2.5 text-[10px]"
            }`}
          >
            <User size={isScrolled ? 10 : 12} />
            Acceso
          </Link>

          {/* ICONO DE MENÚ: Solo visible en móviles (lg:hidden) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden rounded-full flex items-center justify-center transition-all ${
              isScrolled
                ? "w-8 h-8 bg-white/10"
                : "w-10 h-10 bg-white/5 border border-white/10"
            } ${isOpen ? "bg-[#FF6B00] text-black" : "text-white"}`}
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* MENÚ MÓVIL OVERLAY */}
        {isOpen && (
          <div className="fixed inset-x-4 top-20 bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 flex flex-col gap-4 lg:hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-5 duration-300">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-2xl font-black uppercase italic border-b border-white/5 pb-2"
              >
                {item.name}
              </Link>
            ))}
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
