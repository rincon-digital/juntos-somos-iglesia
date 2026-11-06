"use client";
import { Navigation, MessageCircle, Instagram, Facebook } from "lucide-react";
import { PREDICAS_LISTA } from "@/components/Predicas";

// El lunes (Ayuno) se hace en el hogar, no en el templo
const LUGAR_ESPECIAL: Record<string, string> = { Lunes: "En el hogar" };

export default function Ubicacion() {
  // -----------------LINKS----------------------
  const mapUrl =
    "https://maps.google.com/?q=Juntos+Somos+Iglesia+Av.+Juan+B.+Cabral+844+Formosa";
  const mapEmbedUrl =
    "https://maps.google.com/maps?q=Av.+Juan+B.+Cabral+844,+Formosa,+Argentina&z=16&output=embed";

  const whatsappUrl = "https://wa.me/543704601648";
  //-----------------------FIN LINKS -------------------

  return (
    <section
      id="ubicacion"
      className="scroll-mt-12 bg-white px-6 py-24 text-[#0a0a0a] font-[family-name:var(--font-poppins)]"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-xl">
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            Cómo llegar
          </h2>
          <p className="mt-3 text-base text-[#57534e]">
            Te estamos esperando. La entrada es libre y gratuita.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* MAPA */}
          <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] bg-[#f5f5f4] shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
            <iframe
              src={mapEmbedUrl}
              title="Mapa de Juntos Somos Iglesia en Av. Juan B. Cabral 844, Formosa"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>

          <div className="flex flex-col gap-6">
            {/* DIRECCIÓN Y CONTACTO */}
            <div className="rounded-[2rem] border border-[#e7e5e4] p-6 md:p-8">
              <p className="text-sm text-[#57534e]">Dirección</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
                Av. Juan B. Cabral 844
              </p>
              <p className="text-[#57534e]">P3600 Formosa, Argentina</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-[transform,background-color] duration-200 ease-out hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  <Navigation size={16} aria-hidden="true" />
                  Abrir en Google Maps
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#e7e5e4] px-6 text-sm font-medium transition-colors duration-200 hover:border-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  <MessageCircle size={16} className="text-green-700" aria-hidden="true" />
                  Escribinos por WhatsApp
                </a>
              </div>
            </div>

            {/* HORARIOS */}
            <div className="rounded-[2rem] border border-[#e7e5e4] p-6 md:p-8">
              <h3 className="text-xl font-semibold tracking-[-0.01em]">Horarios</h3>
              <ul className="mt-4 divide-y divide-[#e7e5e4]">
                {PREDICAS_LISTA.map((item) => (
                  <li key={item.dia} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.dia}</p>
                      <p className="text-sm text-[#57534e]">
                        {item.titulo}
                        {LUGAR_ESPECIAL[item.dia] && ` · ${LUGAR_ESPECIAL[item.dia]}`}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-sm font-medium tabular-nums">
                      {item.horario}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* REDES */}
            <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-[#e7e5e4] px-6 py-4 md:px-8">
              <p className="font-medium">Seguinos en redes</p>
              <div className="flex gap-2">
                <a
                  href="https://www.instagram.com/somosiglesiaok/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de Juntos Somos Iglesia"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e5e4] text-pink-700 transition-colors duration-200 hover:border-pink-700 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  <Instagram size={18} aria-hidden="true" />
                </a>
                <a
                  href="https://www.facebook.com/juntossomosiglesiafsa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook de Juntos Somos Iglesia"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e5e4] text-blue-700 transition-colors duration-200 hover:border-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
                >
                  <Facebook size={18} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
