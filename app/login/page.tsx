"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ArrowLeft, Lock, Loader2, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { login } from "@/actions/auth/auth";

export default function UnifiedLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".login-card", {
        y: 40,
        opacity: 0,
        duration: 1.2,
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
          scale: 0.9,
          opacity: 0,
          duration: 0.6,
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
        x: 10,
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
    <main className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 selection:bg-[#FF6B00] overflow-hidden">
      <Toaster richColors theme="dark" position="top-right" />

      <div className="w-full max-w-[420px] relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/20 hover:text-[#FF6B00] transition-colors mb-12 text-[10px] font-black uppercase tracking-widest italic"
        >
          <ArrowLeft size={14} /> Volver al Inicio
        </Link>

        <div ref={formRef} className="login-card relative w-full">
          {/* SUCCESS OVERLAY */}
          <div className="success-overlay absolute inset-0 bg-[#FF6B00] rounded-[2.5rem] flex flex-col items-center justify-center z-20 opacity-0 pointer-events-none text-black">
            <ShieldCheck size={70} strokeWidth={1.5} className="mb-4" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
              Accediendo
            </h2>
          </div>

          <div className="bg-[#111]/90 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
            <div className="mb-10 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-pulse" />
                <span className="text-[#FF6B00] text-[10px] font-black uppercase tracking-[0.4em] italic">
                  Portal de Acceso
                </span>
              </div>
              <h1 className="text-5xl font-black uppercase italic text-white tracking-tighter leading-none mt-2">
                Ingreso.
              </h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative group">
                <User
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors"
                  size={18}
                />
                <input
                  name="username"
                  type="text"
                  placeholder="USUARIO"
                  required
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-6 pl-16 pr-6 text-xs font-black uppercase tracking-widest outline-none focus:border-[#FF6B00]/40 transition-all text-white placeholder:text-white/20"
                />
              </div>

              <div className="relative group">
                <Lock
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors"
                  size={18}
                />
                <input
                  name="password"
                  type="password"
                  placeholder="CONTRASEÑA"
                  required
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-6 pl-16 pr-6 text-xs font-black uppercase tracking-widest outline-none focus:border-[#FF6B00]/40 transition-all text-white placeholder:text-white/20"
                />
              </div>

              <button
                disabled={loading}
                className="w-full bg-[#FF6B00] text-black font-black uppercase py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all duration-500 mt-6 italic tracking-tighter disabled:opacity-50 shadow-xl shadow-[#FF6B00]/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> VERIFICANDO...
                  </>
                ) : (
                  "INGRESAR AL TEMPLO"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6B00]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </main>
  );
}
