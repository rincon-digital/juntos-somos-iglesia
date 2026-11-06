"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import {
  registerCourse,
  verifyCourseCodeOnly,
  checkUsernameAvailability,
} from "@/actions/user_course/courseManagement";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  courseId: string;
  onSuccess: () => void;
}

type TabMode = "new" | "existing";

const inputClass =
  "h-12 w-full rounded-xl border border-[#e7e5e4] bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#a8a29e] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30";

const primaryButtonClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] duration-200 ease-out hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80 disabled:active:scale-100";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#292524]">
        {label}
      </label>
      {children}
    </div>
  );
}

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

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#57534e] transition-colors hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div className="relative w-full text-[#0a0a0a]">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-6"
          >
            <div>
              <h4 className="text-xl font-semibold tracking-[-0.01em]">Código de clase</h4>
              <p className="mt-1 text-sm text-[#57534e]">
                Ingresá el código de 6 caracteres que te dio tu líder o pastor.
              </p>
            </div>

            <div className="flex justify-between gap-2">
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
                  aria-label={`Carácter ${index + 1} de 6`}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="h-14 w-full min-w-0 max-w-14 rounded-xl border border-[#e7e5e4] bg-white text-center text-xl font-semibold uppercase outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className={primaryButtonClass}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Validando…
                </>
              ) : (
                "Validar código"
              )}
            </button>

            <p className="text-center text-sm text-[#57534e]">
              ¿No tenés código? Pedíselo al equipo de liderazgo.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-5"
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-[#57534e] transition-colors hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Cambiar código
            </button>

            <div className="relative flex rounded-full bg-[#f5f5f4] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("new")}
                aria-pressed={activeTab === "new"}
                className={`relative z-10 h-10 flex-1 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "new" ? "text-[#0a0a0a]" : "text-[#57534e] hover:text-[#0a0a0a]"
                }`}
              >
                Soy nuevo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("existing")}
                aria-pressed={activeTab === "existing"}
                className={`relative z-10 h-10 flex-1 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "existing" ? "text-[#0a0a0a]" : "text-[#57534e] hover:text-[#0a0a0a]"
                }`}
              >
                Ya tengo cuenta
              </button>
              <motion.div
                className="absolute bottom-1 top-1 z-0 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                initial={false}
                animate={{
                  left: activeTab === "new" ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
              />
            </div>

            {activeTab === "new" ? (
              <div className="flex flex-col gap-4">
                <Field id="reg-nombre" label="Nombre completo">
                  <input
                    id="reg-nombre"
                    name="fullName"
                    autoComplete="name"
                    value={formFields.fullName}
                    onChange={(e) => setFormFields({ ...formFields, fullName: e.target.value })}
                    className={inputClass}
                  />
                </Field>

                <Field id="reg-usuario" label="Usuario">
                  <input
                    id="reg-usuario"
                    name="username"
                    autoComplete="username"
                    spellCheck={false}
                    aria-describedby="reg-usuario-estado"
                    aria-invalid={isUsernameAvailable === false}
                    value={usernameValue}
                    onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    className={`${inputClass} ${
                      isUsernameAvailable === false ? "border-red-600 focus:border-red-600" : ""
                    }`}
                  />
                  <div id="reg-usuario-estado" aria-live="polite" className="text-sm">
                    {checkingUsername ? (
                      <span className="text-[#57534e]">Verificando…</span>
                    ) : isUsernameAvailable === true ? (
                      <span className="text-green-700">Disponible</span>
                    ) : isUsernameAvailable === false ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-red-700">No disponible. Probá con:</span>
                        {suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setUsernameValue(sug)}
                            className="rounded-full border border-[#e7e5e4] px-3 py-1 text-sm font-medium transition-colors hover:border-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#57534e]">Mínimo 3 caracteres, sin espacios.</span>
                    )}
                  </div>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="reg-dni" label="DNI o pasaporte">
                    <input
                      id="reg-dni"
                      name="dni"
                      autoComplete="off"
                      spellCheck={false}
                      value={formFields.dni}
                      onChange={(e) => setFormFields({ ...formFields, dni: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field id="reg-telefono" label="Teléfono">
                    <input
                      id="reg-telefono"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formFields.phone}
                      onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field id="reg-direccion" label="Dirección o ciudad">
                  <input
                    id="reg-direccion"
                    name="address"
                    autoComplete="street-address"
                    value={formFields.address}
                    onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                    className={inputClass}
                  />
                </Field>

                <Field id="reg-password" label="Contraseña">
                  <div className="relative">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formFields.password}
                      onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                      className={`${inputClass} pr-12`}
                    />
                    {passwordToggle}
                  </div>
                </Field>

                <p className="text-sm text-[#57534e]">
                  Usamos estos datos para emitir tu certificado al terminar el curso.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[#57534e]">
                  Ingresá con tu cuenta y sumamos este curso a tus clases.
                </p>
                <Field id="acc-dni" label="DNI o pasaporte">
                  <input
                    id="acc-dni"
                    name="dni"
                    autoComplete="username"
                    spellCheck={false}
                    value={formFields.dni}
                    onChange={(e) => setFormFields({ ...formFields, dni: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field id="acc-password" label="Contraseña">
                  <div className="relative">
                    <input
                      id="acc-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={formFields.password}
                      onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                      className={`${inputClass} pr-12`}
                    />
                    {passwordToggle}
                  </div>
                </Field>
              </div>
            )}

            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={loading}
              className={primaryButtonClass}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Enviando…
                </>
              ) : activeTab === "new" ? (
                "Finalizar inscripción"
              ) : (
                "Ingresar y sumar curso"
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
