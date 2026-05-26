"use client";
import {
  Instagram,
  Facebook,
  MessageCircle,
  Heart,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#0a0a0a] pt-10 pb-6 px-4 md:px-12 border-t border-white/5 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6B00]/5 blur-[120px] rounded-full -z-10 opacity-50" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 mb-24">
          {/* Columna 1: Branding */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-7xl md:text-9xl font-black uppercase italic leading-[0.75] tracking-tighter text-white">
              Juntos <br /> Somos <br />{" "}
              <span className="text-[#FF6B00]">Iglesia</span>
            </h2>
            <div className="flex items-center gap-3 text-white/40 uppercase font-black tracking-[0.3em] text-[10px] group cursor-pointer hover:text-white transition-colors">
              <MapPin size={14} className="text-[#FF6B00]" />
              <span>Av. Juan B. Cabral 844, Formosa, Argentina</span>
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <div className="space-y-8">
            <p className="text-[#FF6B00] text-[10px] uppercase font-black tracking-[0.4em]">
              Explora
            </p>
            <nav className="flex flex-col gap-4">
              {["Inicio", "Prédicas", "Cursos", "Pastor"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-white/40 hover:text-[#FF6B00] transition-all uppercase font-bold text-sm tracking-widest italic flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-4 h-[1px] bg-[#FF6B00] transition-all opacity-0 group-hover:opacity-100" />
                  {item}
                </a>
              ))}
            </nav>
          </div>

          {/* Columna 3: Redes Sociales */}
          <div className="space-y-8">
            <p className="text-[#FF6B00] text-[10px] uppercase font-black tracking-[0.4em]">
              Conecta
            </p>
            <div className="flex flex-col gap-4">
              <a
                href="https://wa.me/543704601648"
                target="_blank"
                className="group flex items-center gap-4 text-white/40 hover:text-white transition-all"
              >
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-all">
                  <MessageCircle size={18} className="group-hover:text-black" />
                </div>
                <div className="flex flex-col">
                  <span className="uppercase font-black text-[10px] tracking-widest leading-none">
                    WhatsApp
                  </span>
                  <span className="text-[9px] opacity-50 font-bold uppercase tracking-widest mt-1">
                    Escribinos
                  </span>
                </div>
              </a>

              <a
                href="https://www.instagram.com/somosiglesiaok/"
                target="_blank"
                className="group flex items-center gap-4 text-white/40 hover:text-white transition-all"
              >
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#FF6B00] group-hover:border-[#FF6B00] transition-all">
                  <Instagram size={18} className="group-hover:text-black" />
                </div>
                <div className="flex flex-col">
                  <span className="uppercase font-black text-[10px] tracking-widest leading-none">
                    Instagram
                  </span>
                  <span className="text-[9px] opacity-50 font-bold uppercase tracking-widest mt-1">
                    Seguinos
                  </span>
                </div>
              </a>

              <a
                href="https://www.facebook.com/juntossomosiglesiafsa"
                target="_blank"
                className="group flex items-center gap-4 text-white/40 hover:text-white transition-all"
              >
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                  <Facebook size={18} className="group-hover:text-black" />
                </div>
                <div className="flex flex-col">
                  <span className="uppercase font-black text-[10px] tracking-widest leading-none">
                    Facebook
                  </span>
                  <span className="text-[9px] opacity-50 font-bold uppercase tracking-widest mt-1">
                    Sumate
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-white/20">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <p className="text-[10px] uppercase font-black tracking-[0.5em]">
              © 2026 Juntos Somos Iglesia — Formosa
            </p>
            <p className="text-[9px] uppercase font-bold tracking-[0.3em]">
              Hecho con ❤️ para la gloria de Dios
            </p>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-3 group"
          >
            <span className="text-[10px] uppercase font-black tracking-[0.5em] group-hover:text-[#FF6B00] transition-colors">
              Volver arriba
            </span>
            <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:border-[#FF6B00] transition-all">
              <ArrowUpRight
                size={16}
                className="group-hover:text-[#FF6B00] transition-all"
              />
            </div>
          </button>

          <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.5em]">
            Un lugar para todos{" "}
            <Heart size={12} className="text-[#FF6B00] fill-[#FF6B00]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
