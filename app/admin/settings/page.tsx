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
  Wand2,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import { createAdmin, getAdminProfileData, updateAdminProfile, checkUsernameAvailability } from "@/actions/admin/admin.actions";
import { Role } from "@/lib/types/definitions";
import { validateSessionUser, changePassword } from "@/actions/user";
import { toast, Toaster } from "sonner";

export default function SettingsPage() {
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);

  // Estados para el formulario
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<any>({});

  // Estados para editar perfil
  const [profileData, setProfileData] = useState({ fullName: "", username: "" });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Estados para seguridad
  const [passwordData, setPasswordData] = useState({ current: "", new: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // --- Validar sesión al montar el componente ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await validateSessionUser();
        if (session && session.role) {
          setUserRole(session.role as Role);
          const data = await getAdminProfileData();
          if (data) {
             setProfileData({ fullName: data.fullName, username: data.username });
          }
        }
      } catch (error) {
        console.error("Error validando sesión:", error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // --- Check Username en vivo ---
  useEffect(() => {
    const checkUsername = async () => {
      // Evitamos chequeos si no hay datos inicializados o si es muy corto
      if (!profileData.username || profileData.username.length < 3) {
        setSuggestions([]);
        return;
      }
      setIsCheckingUsername(true);
      const result = await checkUsernameAvailability(profileData.username);
      if (!result.available) {
        setSuggestions(result.suggestions || []);
      } else {
        setSuggestions([]);
      }
      setIsCheckingUsername(false);
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [profileData.username]);

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
      
      try {
        const parsedError = JSON.parse(result.message);
        setErrors(parsedError);
      } catch (e) {
        toast.error(result.message);
      }
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuggestions([]);

    const result = await updateAdminProfile(profileData);
    if (result.ok) {
      toast.success(result.message);
      setShowEditProfile(false);
    } else {
      toast.error(result.message);
      if (result.suggestions) {
        setSuggestions(result.suggestions);
      }
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const result = await changePassword(passwordData.current, passwordData.new);
    if (result.success) {
      toast.success(result.success);
      setShowSecurity(false);
      setPasswordData({ current: "", new: "" });
      setGeneratedPassword("");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
    setPasswordData({ ...passwordData, new: pwd });
    toast.warning("Contraseña generada. Por favor cópiala y guárdala en un lugar seguro antes de guardar los cambios.", { duration: 8000 });
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
            description="Cambia tu nombre público, contacto y usuario."
            onClick={() => {
              setSuggestions([]);
              setShowEditProfile(true);
            }}
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
            onClick={() => {
              setPasswordData({ current: "", new: "" });
              setGeneratedPassword("");
              setShowSecurity(true);
            }}
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

        {/* --- MODAL PARA EDITAR PERFIL --- */}
        <AnimatePresence>
          {showEditProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditProfile(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="absolute top-6 right-6 text-white/20 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <h2 className="text-2xl font-black uppercase italic text-white mb-8">
                  Editar <span className="text-[#FF6B00]">Perfil</span>
                </h2>

                <form
                  onSubmit={handleUpdateProfile}
                  className="flex flex-col gap-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">
                        Nombre Completo
                      </label>
                      <input
                        required
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center ml-2 pr-2">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                          Username
                        </label>
                        {isCheckingUsername && (
                          <Loader2 size={12} className="animate-spin text-[#FF6B00]" />
                        )}
                      </div>
                      <input
                        required
                        value={profileData.username}
                        onChange={(e) => {
                          setProfileData({ ...profileData, username: e.target.value.toLowerCase().replace(/\s/g, "") });
                        }}
                        className={`bg-white/5 border ${suggestions.length > 0 ? "border-[#FF6B00]/50" : "border-white/10"} rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors`}
                      />
                      {suggestions.length > 0 && (
                        <div className="mt-2 p-4 bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-2xl">
                          <p className="text-[9px] font-black uppercase text-[#FF6B00] mb-3 flex items-center gap-2">
                            <AlertTriangle size={10} /> Nombre en uso. Sugerencias:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => {
                                  setProfileData({ ...profileData, username: sug });
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
                    </div>
                  </div>

                  <button
                    disabled={loading || suggestions.length > 0}
                    className="mt-4 bg-white text-black font-black uppercase py-5 rounded-2xl tracking-widest text-[10px] hover:bg-[#FF6B00] hover:text-white disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-3 w-full md:w-auto md:ml-auto md:px-12"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Guardar Cambios"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- MODAL DE SEGURIDAD --- */}
        <AnimatePresence>
          {showSecurity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSecurity(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
              >
                <button
                  onClick={() => setShowSecurity(false)}
                  className="absolute top-6 right-6 text-white/20 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <h2 className="text-2xl font-black uppercase italic text-white mb-8">
                  Seguridad <span className="text-[#FF6B00]">y Acceso</span>
                </h2>

                <form
                  onSubmit={handleUpdatePassword}
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end ml-2">
                      <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                        Nueva Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-[9px] text-[#FF6B00] font-bold uppercase tracking-widest hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Wand2 size={10} /> Generar Fuerte
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={passwordData.new}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, new: e.target.value });
                          setGeneratedPassword("");
                        }}
                        className={`w-full bg-white/5 border ${generatedPassword ? "border-[#FF6B00]/50" : "border-white/10"} rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors pr-12`}
                        placeholder="••••••••"
                      />
                    </div>
                    {generatedPassword && (
                      <div className="mt-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 p-4 rounded-xl flex gap-3 items-start">
                        <AlertTriangle size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#FF6B00] font-bold leading-relaxed">
                          Has generado una contraseña segura. 
                          <strong className="block mt-1 uppercase">Asegúrate de copiarla en un lugar seguro antes de guardar los cambios.</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={loading}
                    className="mt-6 bg-white text-black font-black uppercase py-5 rounded-2xl tracking-widest text-[10px] hover:bg-[#FF6B00] hover:text-white disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Actualizar Contraseña"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
                className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto"
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

// Subcomponente SettingsCard
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
