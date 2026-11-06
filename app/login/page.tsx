"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { login } from "@/actions/auth/auth";

const inputClass =
  "h-12 w-full rounded-xl border border-[#e7e5e4] bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] duration-200 hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30";

export default function UnifiedLogin() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".login-card", {
        y: 16,
        opacity: 0,
        duration: 0.8,
        ease: "expo.out",
      });
    });
    return () => ctx.revert();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const res = await login(username, password);

    if (res.success) {
      toast.success("¡Bienvenido!", {
        description: "Accediendo al templo...",
      });

      const tl = gsap.timeline();
      tl.to(".success-overlay", { opacity: 1, duration: 0.4 }).to(
        formRef.current,
        {
          scale: 0.96,
          opacity: 0,
          duration: 0.5,
          delay: 0.3,
          onComplete: () => {
            if (res.role === "admin" || res.role === "superadmin") {
              window.location.href = "/admin";
            } else {
              window.location.href = "/dashboard-estudiante";
            }
          },
        },
      );
    } else {
      toast.error(res.error || "Credenciales inválidas", {
        description: "Revisa tu usuario y contraseña e intenta nuevamente.",
      });

      gsap.to(formRef.current, {
        x: 8,
        repeat: 3,
        yoyo: true,
        duration: 0.05,
        onComplete: () => {
          gsap.set(formRef.current, { x: 0 });
        },
      });
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white text-[#0a0a0a] selection:bg-[#FF6B00] selection:text-black font-[family-name:var(--font-poppins)] lg:grid-cols-2">
      {/* FOTO DE LA IGLESIA (solo en pantallas grandes) */}
      <div className="relative hidden overflow-hidden bg-[#0a0a0a] lg:block">
        <img
          src="/iglesia.webp"
          alt="Culto en Juntos Somos Iglesia"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-balance">
            Juntos Somos Iglesia
          </p>
          <p className="mt-3 max-w-sm text-white/85">
            Tus cursos, tus clases y la vida de la iglesia, en un solo lugar.
          </p>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="flex flex-col px-6 py-8 md:px-12">
        <Link
          href="/"
          className="group inline-flex h-11 w-fit items-center gap-2 rounded-full border border-[#e7e5e4] pl-2 pr-5 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f4] transition-colors group-hover:bg-white">
            <ArrowLeft size={16} aria-hidden="true" />
          </span>
          Volver al inicio
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div ref={formRef} className="login-card relative w-full max-w-sm">
            {/* SUCCESS OVERLAY */}
            <div className="success-overlay pointer-events-none absolute -inset-6 z-20 flex flex-col items-center justify-center rounded-[2rem] bg-[#FF6B00] text-black opacity-0">
              <ShieldCheck size={56} strokeWidth={1.5} className="mb-3" aria-hidden="true" />
              <p className="text-xl font-semibold">Accediendo…</p>
            </div>

            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF6B00]">
                <img src="/Logo.webp" alt="" aria-hidden="true" className="h-6 w-6 brightness-0 invert" />
              </span>
              <span className="font-semibold">Juntos Somos Iglesia</span>
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.03em]">Ingresar</h1>
            <p className="mt-2 text-[#57534e]">Entrá con tu usuario y contraseña.</p>

            <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-usuario" className="text-sm font-medium text-[#292524]">
                  Usuario
                </label>
                <input
                  id="login-usuario"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-[#292524]">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#57534e] transition-colors hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] duration-200 ease-out hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" /> Verificando…
                  </>
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
