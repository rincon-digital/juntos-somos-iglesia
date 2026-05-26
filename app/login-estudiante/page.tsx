"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Fingerprint, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { login } from "@/actions/auth/auth";

export default function StudentLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const res = await login(username, password);

    if (res.success) {
      toast.success("Bienvenido a tu formación");
      router.push("/dashboard-estudiante");
      router.refresh();
    } else {
      toast.error(res.error || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 selection:bg-[#FF6B00]">
      <Toaster richColors theme="dark" />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/20 hover:text-[#FF6B00] transition-colors mb-12 text-[10px] font-black uppercase tracking-widest italic"
        >
          <ArrowLeft size={14} /> Volver al Inicio
        </Link>

        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10 md:p-12 shadow-2xl">
          <div className="mb-10 text-left">
            <span className="text-[#FF6B00] text-[10px] font-black uppercase tracking-[0.4em] italic">
              Estudiantes
            </span>
            <h1 className="text-5xl font-black uppercase italic text-white tracking-tighter leading-none mt-2">
              Acceso.
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <Fingerprint
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors"
                size={20}
              />
              <input
                name="username"
                type="text"
                placeholder="NOMBRE DE USUARIO"
                required
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-xs font-black uppercase tracking-widest outline-none focus:border-[#FF6B00]/40 transition-all text-white"
              />
            </div>

            <div className="relative group">
              <Lock
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors"
                size={20}
              />
              <input
                name="password"
                type="password"
                placeholder="CONTRASEÑA"
                required
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-xs font-black uppercase tracking-widest outline-none focus:border-[#FF6B00]/40 transition-all text-white"
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-[#FF6B00] text-black font-black uppercase py-6 rounded-2xl hover:bg-white transition-all mt-6 italic tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Ingresar a mis clases"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
