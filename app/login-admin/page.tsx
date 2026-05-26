"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { login } from "@/actions/auth/auth";
import { Toaster, toast } from "sonner";

export default function LoginPastores() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(username, password);

      if (result?.success) {
        toast.success("¡Bienvenido!", {
          description: "Sincronizando portal de administración...",
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
              // ✅ Corregido: Usamos llaves para evitar el retorno implícito
              window.location.href = "/admin";
            },
          },
        );
      } else {
        toast.error("Acceso Denegado", {
          description:
            result?.error || "Credenciales de administrador inválidas.",
        });

        gsap.to(formRef.current, {
          x: 10,
          repeat: 3,
          yoyo: true,
          duration: 0.05,
          onComplete: () => {
            // ✅ Corregido aquí también
            gsap.set(formRef.current, { x: 0 });
          },
        });
      }
    } catch (err) {
      toast.error("Fallo de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative bg-[#0a0a0a] min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <Toaster position="top-right" theme="dark" richColors />

      <div
        ref={formRef}
        className="login-card relative w-full max-w-[420px] z-10"
      >
        {/* SUCCESS OVERLAY */}
        <div className="success-overlay absolute inset-0 bg-[#FF6B00] rounded-[2.5rem] flex flex-col items-center justify-center z-20 opacity-0 pointer-events-none text-black">
          <ShieldCheck size={70} strokeWidth={1.5} className="mb-4" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">
            Sincronizado
          </h2>
        </div>

        <div className="bg-[#111]/90 backdrop-blur-3xl border border-white/5 p-10 md:p-14 rounded-[2.5rem] shadow-2xl">
          <div className="mb-10 text-center text-left">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/40 italic text-left">
                Church OS v2.0
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase italic text-white leading-none tracking-tighter text-left">
              Pastor
              <br />
              <span className="text-[#FF6B00] not-italic">Login.</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="group relative">
              <User
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors"
                size={18}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-6 pl-16 pr-6 text-white outline-none focus:border-[#FF6B00]/40 font-bold placeholder:text-white/5 transition-all"
                placeholder="USUARIO"
                required
              />
            </div>

            <div className="group relative">
              <Lock
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors"
                size={18}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-6 pl-16 pr-6 text-white outline-none focus:border-[#FF6B00]/40 font-bold placeholder:text-white/5 transition-all"
                placeholder="CONTRASEÑA"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B00] text-black font-black uppercase py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all duration-500 disabled:opacity-50 mt-6 italic shadow-xl shadow-[#FF6B00]/10"
            >
              {loading ? "VERIFICANDO..." : "INGRESAR AL PORTAL"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <p className="mt-8 text-center text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
            Acceso restringido para personal autorizado
          </p>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6B00]/5 blur-[120px] rounded-full -z-10" />
    </main>
  );
}
