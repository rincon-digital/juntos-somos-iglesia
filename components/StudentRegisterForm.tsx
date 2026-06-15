"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Fingerprint,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  Loader2,
  Info,
  ArrowLeft,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import {
  registerCourse,
  verifyCourseCodeOnly,
  checkUsernameAvailability,
} from "@/actions/user_course/courseManagement";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  courseId: string;
  onSuccess: () => void;
}

type TabMode = "new" | "existing";

export default function StudentRegisterForm({ courseId, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>("new");
  const [step, setStep] = useState<1 | 2>(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [usernameValue, setUsernameValue] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [formFields, setFormFields] = useState({
    fullName: "",
    dni: "",
    phone: "",
    address: "",
    password: "",
  });

  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (activeTab === "new" && usernameValue.length >= 3) {
      const timeoutId = setTimeout(async () => {
        setCheckingUsername(true);
        try {
          const res = await checkUsernameAvailability(usernameValue);
          if (res.available) {
            setIsUsernameAvailable(true);
            setSuggestions([]);
          } else {
            setIsUsernameAvailable(false);
            setSuggestions(res.suggestions || []);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setIsUsernameAvailable(null);
      setSuggestions([]);
    }
  }, [usernameValue, activeTab]);

  const handleCodeChange = (index: number, value: string) => {
    const val = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    
    if (val.length > 1) {
      const newCode = [...codeDigits];
      for (let i = 0; i < val.length && index + i < 6; i++) {
        newCode[index + i] = val[i];
      }
      setCodeDigits(newCode);
      const nextIndex = Math.min(index + val.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...codeDigits];
    newCode[index] = val;
    setCodeDigits(newCode);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = async () => {
    const fullCode = codeDigits.join("");
    if (fullCode.length < 6) {
      toast.error("Código incompleto");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyCourseCodeOnly(courseId, fullCode);
      if (res.error) {
        toast.error(res.error);
      } else {
        setStep(2);
      }
    } catch (error) {
      toast.error("Error de verificación");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (activeTab === "new" && isUsernameAvailable === false) {
      toast.error("Nombre de usuario no disponible");
      return;
    }

    setLoading(true);

    const data = {
      fullName: activeTab === "existing" ? "EXISTING_USER" : formFields.fullName,
      username: activeTab === "existing" ? "EXISTING_USER" : usernameValue,
      dni: formFields.dni,
      phone: activeTab === "existing" ? "000000" : formFields.phone,
      address: activeTab === "existing" ? "EXISTING_ADDRESS" : formFields.address,
      password: formFields.password,
      courseId: courseId,
      code: codeDigits.join(""),
    };

    try {
      const res = await registerCourse(data as any);

      if (res && !res.error) {
        toast.success("¡Bienvenido! Entrando al sistema...");
        router.push("/dashboard-estudiante");
        onSuccess();
      } else {
        toast.error(res?.error || "Error al procesar el registro");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-white relative">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)", transition: { duration: 0.2 } }}
            className="flex flex-col gap-5 max-w-xl mx-auto"
          >
            {/* Header del Modal */}
            <div className="text-center space-y-2 relative">
              <div className="w-12 h-12 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl mx-auto flex items-center justify-center mb-3">
                <KeyRound className="text-[#FF6B00]" size={20} strokeWidth={2.5} />
              </div>
              <h4 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                Código de <span className="text-[#FF6B00]">Clase</span>
              </h4>
              <p className="text-xs text-white/50 font-medium max-w-sm mx-auto leading-relaxed">
                Ingresa el código único de 6 dígitos que te proporcionó tu líder o pastor.
              </p>
            </div>

            {/* Caja de Inputs */}
            <div className="bg-[#0d0d0d] border border-white/10 rounded-[1.5rem] p-6 relative overflow-hidden shadow-2xl">
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#FF6B00]/5 blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="flex gap-2 justify-center">
                  {codeDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-10 h-12 md:w-12 md:h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl md:text-2xl font-black text-white focus:text-[#FF6B00] focus:bg-[#FF6B00]/5 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none transition-all uppercase placeholder-white/10 shadow-inner"
                      placeholder="-"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading}
                  className="w-full max-w-[250px] group relative bg-[#FF6B00] text-black font-black uppercase py-3.5 rounded-xl text-xs tracking-[0.2em] hover:bg-white transition-all duration-300 flex justify-center items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  {loading ? (
                    <Loader2 size={16} className="animate-spin relative z-10" />
                  ) : (
                    <span className="relative z-10 flex items-center gap-2">
                      Validar Acceso <ArrowRight size={14} />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-xl max-w-xl mx-auto w-full">
              <ShieldCheck className="text-[#FF6B00] shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-white/40 leading-relaxed">
                Este sistema está protegido. Si no tienes tu código de acceso o ha expirado, por favor contacta al equipo de liderazgo.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="flex flex-col gap-4 w-full"
          >
            {/* Header Reducido Step 2 */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-xs font-black uppercase text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Atrás
              </button>
              <div className="flex items-center gap-2 text-[#FF6B00]">
                <Sparkles size={14} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Registro de Alumno
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 lg:gap-6">
              {/* Columna Izquierda: Formulario */}
              <div className="space-y-4">
                {/* Segmented Control Moderno */}
                <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5 relative">
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className={`relative flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${
                      activeTab === "new" ? "text-black" : "text-white/40 hover:text-white"
                    }`}
                  >
                    Nuevo Alumno
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("existing")}
                    className={`relative flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${
                      activeTab === "existing" ? "text-black" : "text-white/40 hover:text-white"
                    }`}
                  >
                    Ya tengo cuenta
                  </button>
                  {/* Píldora animada */}
                  <motion.div
                    className="absolute top-1 bottom-1 bg-[#FF6B00] rounded-lg z-0"
                    initial={false}
                    animate={{
                      left: activeTab === "new" ? "4px" : "50%",
                      width: "calc(50% - 4px)"
                    }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                </div>

                <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-5">
                  {activeTab === "new" ? (
                    <div className="space-y-3.5">
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={16} />
                        <input
                          placeholder="NOMBRE COMPLETO"
                          value={formFields.fullName}
                          onChange={(e) => setFormFields({ ...formFields, fullName: e.target.value })}
                          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:bg-[#FF6B00]/5 focus:border-[#FF6B00]/50 transition-all placeholder-white/20"
                        />
                      </div>

                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          {checkingUsername ? (
                            <Loader2 size={16} className="animate-spin text-[#FF6B00]" />
                          ) : (
                            <User size={16} className="text-[#FF6B00]" />
                          )}
                        </div>
                        <input
                          placeholder="CREA UN USUARIO ÚNICO"
                          value={usernameValue}
                          onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/\s/g, ""))}
                          className={`w-full bg-[#FF6B00]/5 border rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none transition-all placeholder-[#FF6B00]/40 ${
                            isUsernameAvailable === true
                              ? "border-green-500/50 focus:border-green-500"
                              : isUsernameAvailable === false
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-[#FF6B00]/20 focus:border-[#FF6B00]"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="relative group">
                          <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={16} />
                          <input
                            placeholder="DNI O PASAPORTE"
                            value={formFields.dni}
                            onChange={(e) => setFormFields({ ...formFields, dni: e.target.value })}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-white/30 transition-all placeholder-white/20"
                          />
                        </div>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={16} />
                          <input
                            placeholder="TELÉFONO"
                            value={formFields.phone}
                            onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-white/30 transition-all placeholder-white/20"
                          />
                        </div>
                      </div>

                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={16} />
                        <input
                          placeholder="DIRECCIÓN O CIUDAD"
                          value={formFields.address}
                          onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-white/30 transition-all uppercase placeholder-white/20"
                        />
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={16} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="CREA UNA CONTRASEÑA"
                          value={formFields.password}
                          onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-12 text-xs font-bold outline-none focus:border-white/30 transition-all placeholder-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                          <GraduationCap size={20} className="text-white/40" />
                        </div>
                        <h5 className="text-sm font-black uppercase tracking-tight">Bienvenido de nuevo</h5>
                        <p className="text-xs text-white/40 mt-1">Ingresa tus credenciales para vincular este nuevo curso.</p>
                      </div>

                      <div className="relative group">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6B00]" size={16} />
                        <input
                          placeholder="TU DNI O DOCUMENTO"
                          value={formFields.dni}
                          onChange={(e) => setFormFields({ ...formFields, dni: e.target.value })}
                          className="w-full bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-xl py-3.5 pl-12 pr-4 text-xs font-black outline-none focus:border-[#FF6B00] tracking-widest transition-colors placeholder-[#FF6B00]/30"
                        />
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6B00]" size={16} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="TU CONTRASEÑA"
                          value={formFields.password}
                          onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                          className="w-full bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-xl py-3.5 pl-12 pr-12 text-xs font-black outline-none focus:border-[#FF6B00] tracking-widest transition-colors placeholder-[#FF6B00]/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF6B00]/60 hover:text-[#FF6B00] transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={loading}
                    className="w-full group relative overflow-hidden bg-white text-black font-black uppercase py-3.5 mt-5 rounded-xl hover:bg-[#FF6B00] transition-all flex items-center justify-center gap-2 text-xs tracking-[0.15em]"
                  >
                    <div className="absolute inset-0 bg-[#FF6B00] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    {loading ? (
                      <Loader2 className="animate-spin relative z-10" size={18} />
                    ) : (
                      <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
                        {activeTab === "new" ? "Finalizar Registro" : "Acceder y Vincular"} <ArrowRight size={16} />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Tips / Sugerencias */}
              <div className="space-y-4">
                {activeTab === "new" ? (
                  <>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Info size={16} className="text-white/40" />
                        <p className="text-xs font-black uppercase text-white/40 tracking-widest">
                          Estado de Usuario
                        </p>
                      </div>
                      
                      <AnimatePresence mode="wait">
                        {suggestions.length > 0 ? (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <p className="text-xs font-bold uppercase text-red-400 mb-2">
                              No disponible. Opciones:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.map((sug) => (
                                <button
                                  key={sug}
                                  type="button"
                                  onClick={() => setUsernameValue(sug)}
                                  className="text-xs bg-white/5 hover:bg-[#FF6B00] hover:text-black hover:border-[#FF6B00] px-3 py-2 rounded-lg transition-all border border-white/10 font-black"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-white/50 font-medium leading-relaxed"
                          >
                            {isUsernameAvailable === true
                              ? "¡Excelente! Este nombre de usuario está libre y listo para usar."
                              : "A medida que escribas tu usuario, verificaremos si está disponible."}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-[#FF6B00]/10 to-transparent border border-[#FF6B00]/20 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-[#FF6B00]">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">
                          Privacidad Segura
                        </span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed font-medium">
                        Tu información está encriptada. Solo requerimos estos datos para generar tu certificado final al concluir la clase.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Lock size={24} className="text-white/20" />
                    </div>
                    <h6 className="text-sm font-black uppercase mb-2">Conexión Segura</h6>
                    <p className="text-xs text-white/40 font-medium leading-relaxed">
                      Al ingresar, el nuevo programa de formación será añadido instantáneamente a tu biblioteca de clases sin necesidad de rellenar datos adicionales.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
