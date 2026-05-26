"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  UserCircle,
  Trash2,
  ShieldCheck,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { createAdmin } from "@/actions/admin/admin.actions";
import { Role } from "@/lib/types/definitions";
import { validateSessionUser } from "@/actions/user";
import { toast, Toaster } from "sonner";

export default function SettingsPage() {
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);

  // Estados para el formulario
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<any>({});

  // --- Validar sesión al montar el componente ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await validateSessionUser();
        if (session && session.role) {
          setUserRole(session.role as Role);
        }
      } catch (error) {
        console.error("Error validando sesión:", error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const formData = new FormData(e.currentTarget);

    const result = await createAdmin(
      username,
      formData.get("password") as string,
      formData.get("fullName") as string,
      formData.get("role") as Role,
    );

    if (result.ok) {
      toast.success("Usuario creado con éxito");
      setShowCreateAdmin(false);
      setUsername("");
      setSuggestions([]);
    } else {
      if (result.suggestions) {
        setSuggestions(result.suggestions);
        toast.error("Nombre de usuario no disponible");
      }
      
      // Manejar errores de validación (JSON stringified)
      try {
        const parsedError = JSON.parse(result.message);
        setErrors(parsedError);
      } catch (e) {
        toast.error(result.message);
      }
    }
    setLoading(false);
  };

  // Lógica de permisos
  const isSuperAdmin = userRole === Role.superadmin;

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="text-[#FF6B00] animate-spin" size={40} />
        <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      <Toaster richColors theme="dark" />
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#FF6B00]">
            Configuración
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
            Gestión de cuenta y privilegios de sistema
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsCard
            icon={<UserCircle size={24} />}
            title="Editar Perfil"
            description="Cambia tu nombre público y foto de perfil."
            onClick={() => toast.info("Próximamente: Edición de perfil")}
          />

          {/* SOLO SE MUESTRA SI ES SUPERADMIN */}
          {isSuperAdmin && (
            <SettingsCard
              icon={<UserPlus size={24} />}
              title="Crear Usuario"
              description="Otorga acceso de gestión a un nuevo colaborador."
              highlight
              onClick={() => {
                setErrors({});
                setSuggestions([]);
                setShowCreateAdmin(true);
              }}
            />
          )}

          <SettingsCard
            icon={<ShieldCheck size={24} />}
            title="Seguridad"
            description="Actualiza tu contraseña y claves de acceso."
            onClick={() => toast.info("Próximamente: Seguridad")}
          />

          <SettingsCard
            icon={<Trash2 size={24} />}
            title="Eliminar Cuenta"
            description="Borra permanentemente tu cuenta de administrador."
            danger
            onClick={() => {
              if (confirm("¿Estás seguro? Esta acción es irreversible.")) {
                toast.error("Funcionalidad deshabilitada temporalmente");
              }
            }}
          />
        </div>

        {/* --- MODAL PARA CREAR ADMIN --- */}
        <AnimatePresence>
          {showCreateAdmin && isSuperAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateAdmin(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
              >
                <button
                  onClick={() => setShowCreateAdmin(false)}
                  className="absolute top-6 right-6 text-white/20 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <h2 className="text-2xl font-black uppercase italic text-white mb-8">
                  Nuevo <span className="text-[#FF6B00]">Usuario</span>
                </h2>

                <form
                  onSubmit={handleCreateAdmin}
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">
                      Nombre Completo
                    </label>
                    <input
                      name="fullName"
                      required
                      className={`bg-white/5 border ${errors.fullName ? "border-red-500/50" : "border-white/10"} rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors`}
                      placeholder="Ej. Juan Pérez"
                    />
                    {errors.fullName && (
                      <p className="text-[10px] text-red-500 font-bold uppercase ml-2 italic">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">
                      Username
                    </label>
                    <input
                      name="username"
                      required
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/\s/g, ""));
                        setSuggestions([]);
                      }}
                      className={`bg-white/5 border ${suggestions.length > 0 || errors.username ? "border-[#FF6B00]/50" : "border-white/10"} rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors`}
                      placeholder="juan.admin"
                    />
                    {suggestions.length > 0 && (
                      <div className="mt-2 p-4 bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-[#FF6B00] mb-3 flex items-center gap-2">
                          <Loader2 size={10} className="animate-pulse" /> Sugerencias disponibles:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                setUsername(sug);
                                setSuggestions([]);
                              }}
                              className="text-[10px] bg-white/5 hover:bg-[#FF6B00] hover:text-black px-3 py-1.5 rounded-lg text-white font-black transition-all border border-white/5"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {errors.username && (
                      <p className="text-[10px] text-red-500 font-bold uppercase ml-2 italic">
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">
                      Rol de Usuario
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        required
                        defaultValue={Role.admin}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors appearance-none cursor-pointer font-bold"
                      >
                        {Object.values(Role).map((role) => (
                          <option
                            key={role}
                            value={role}
                            className="bg-[#0a0a0a] text-white"
                          >
                            {role.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">
                      Contraseña
                    </label>
                    <input
                      name="password"
                      type="password"
                      required
                      className={`bg-white/5 border ${errors.password ? "border-red-500/50" : "border-white/10"} rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors`}
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <p className="text-[10px] text-red-500 font-bold uppercase ml-2 italic">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <button
                    disabled={loading}
                    className="mt-6 bg-white text-black font-black uppercase py-5 rounded-2xl tracking-widest text-[10px] hover:bg-[#FF6B00] hover:text-white disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Registrar Usuario"
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Subcomponente SettingsCard (Sin cambios)
function SettingsCard({
  icon,
  title,
  description,
  onClick,
  highlight,
  danger,
}: any) {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-start gap-5 p-6 rounded-3xl border text-left transition-all duration-300 ${
        danger
          ? "bg-red-500/5 border-red-500/20 hover:border-red-500/50"
          : highlight
            ? "bg-[#FF6B00]/5 border-[#FF6B00]/20 hover:border-[#FF6B00]/50"
            : "bg-white/5 border-white/10 hover:border-white/30"
      }`}
    >
      <div
        className={`p-3 rounded-2xl ${danger ? "text-red-500 bg-red-500/10" : "text-[#FF6B00] bg-[#FF6B00]/10"}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-black uppercase italic tracking-wider text-sm mb-1">
          {title}
        </h3>
        <p className="text-white/40 text-xs leading-relaxed">{description}</p>
      </div>
    </motion.button>
  );
}
