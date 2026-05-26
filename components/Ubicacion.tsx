"use client";
import {
  MapPin,
  Navigation,
  Clock,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
} from "lucide-react";

export default function Ubicacion() {
  // -----------------LINKS----------------------
  const mapUrl =
    "https://maps.google.com/?q=Juntos+Somos+Iglesia+Av.+Juan+B.+Cabral+844+Formosa";

  const whatsappUrl = "https://wa.me/543704601648";
  //-----------------------FIN LINKS -------------------
  return (
    <section id="ubicacion" className="py-18 px-6 md:px-10 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-[#FF6B00] uppercase tracking-[0.5em] text-[10px] font-bold italic">
              Ubicación
            </span>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic text-white leading-none mt-2 tracking-tighter">
              Nuestra <br />{" "}
              <span className="text-[#FF6B00] not-italic">Casa.</span>
            </h2>
          </div>

          {/* Redes Sociales */}
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/somosiglesiaok/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#FF6B00] hover:text-black transition-all duration-500"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.facebook.com/juntossomosiglesiafsa"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#FF6B00] hover:text-black transition-all duration-500"
            >
              <Facebook size={20} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta de Dirección */}
          <div className="md:col-span-1 bg-[#111] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between group hover:border-[#FF6B00]/30 transition-all">
            <div>
              <MapPin className="text-[#FF6B00] w-10 h-10 mb-6" />
              <h3 className="text-2xl font-black uppercase italic text-white mb-2">
                Dirección
              </h3>
              <p className="text-white/60 text-lg leading-tight font-medium italic">
                Av. Juan B. Cabral 844, <br />
                P3600 Formosa, Argentina.
              </p>
            </div>
          </div>

          {/* Tarjeta de Invitación y Botón GPS */}
          <div className="md:col-span-2 bg-[#1a1a1a] rounded-[2rem] p-10 md:p-16 flex flex-col justify-center items-center text-center border border-white/5 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#FF6B00]/10 blur-[100px] rounded-full group-hover:bg-[#FF6B00]/20 transition-all duration-700" />

            <h3 className="text-2xl md:text-4xl font-black uppercase italic text-white mb-8 tracking-tighter relative z-10">
              Te estamos <br />{" "}
              <span className="text-[#FF6B00]">esperando.</span>
            </h3>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative inline-flex items-center gap-4 bg-[#FF6B00] text-black font-black uppercase italic px-10 py-6 rounded-2xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,107,0,0.3)]"
            >
              <Navigation className="w-4 h-4 fill-current group-hover/btn:animate-bounce" />
              <span className="text-xl tracking-tighter">
                Abrir en Google Maps
              </span>
            </a>
          </div>

          {/* Tarjeta de Horarios / WhatsApp */}
          <div className="md:col-span-3 bg-[#111] border border-white/5 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
                <Clock className="text-[#FF6B00] w-7 h-7" />
              </div>
              <div>
                <p className="text-[#FF6B00] text-[10px] uppercase font-bold tracking-[0.2em]">
                  Horarios
                </p>
                <p className="text-white text-xl font-black italic uppercase">
                  19:30 — 21:30 HS
                </p>
              </div>
            </div>

            <div className="hidden md:block w-[1px] h-12 bg-white/10"></div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-6 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 transition-colors duration-500">
                <MessageCircle className="text-green-500 w-7 h-7 group-hover:text-black transition-colors" />
              </div>
              <div>
                <p className="text-green-500 text-[10px] uppercase font-bold tracking-[0.2em]">
                  WhatsApp
                </p>
                <p className="text-white text-xl font-black italic uppercase group-hover:text-green-500 transition-colors">
                  Contactanos
                </p>
              </div>
            </a>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-pulse" />
              <p className="text-white/40 text-[10px] uppercase font-black tracking-widest italic font-bold">
                Entrada Libre y Gratuita
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
