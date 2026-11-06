"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Search,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/auth";
import { getAdmins, getAdminCourses, deleteAdmin, revokeAdminAccess } from "@/actions/admin/dashboard";
import { createAdmin, checkUsernameAvailability } from "@/actions/admin/admin.actions";
import { Role } from "@/lib/types/definitions";
import { toast } from "@/lib/toast";

const inputClass =
  "h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-[border-color,box-shadow] duration-200 focus:ring-2 focus:ring-[#FF6B00]/30";
const inputOk = "border-[#e7e5e4] hover:border-[#d6d3d1] focus:border-[#0a0a0a]";
const inputBad = "border-red-600 focus:border-red-600";

const pillButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-[transform,background-color,border-color] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2";

const sinceDate = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

function Avatar({ name, size = "h-11 w-11" }: { name?: string; size?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[#fff7ed] font-semibold text-[#C2410C]`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );
}

function CourseRow({ course, detail }: { course: any; detail: string }) {
  const pct = course.quotaLimit > 0 ? Math.min(100, Math.round((course.studentCount / course.quotaLimit) * 100)) : 0;
  const closed = course.deadline && new Date(course.deadline).getTime() < Date.now();
  return (
    <li className="flex items-center gap-4 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-[#292524]">
        <BookOpen size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium capitalize">{course.name.toLowerCase()}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${closed ? "bg-[#fef2f2] text-red-700" : "bg-[#ecfdf5] text-green-700"}`}>
            {closed ? "Cerrado" : "Abierto"}
          </span>
        </div>
        <p className="truncate text-sm text-[#57534e]">{detail}</p>
      </div>
      <div className="w-40 shrink-0">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-[#57534e]">Alumnos</span>
          <span className="font-medium tabular-nums">{course.studentCount}/{course.quotaLimit}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#f5f5f4]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className={`h-full rounded-full ${pct >= 90 ? "bg-red-600" : "bg-[#FF6B00]"}`}
          />
        </div>
      </div>
    </li>
  );
}

// Alta de usuarios del panel (antes estaba en Configuración)
function CreateStaffModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername("");
    setSuggestions([]);
    setAvailable(null);
    setErrors({});
  }, [open]);

  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      setSuggestions([]);
      return;
    }
    const id = setTimeout(async () => {
      const res = await checkUsernameAvailability(username);
      setAvailable(!!res.available);
      setSuggestions(res.available ? [] : res.suggestions || []);
    }, 500);
    return () => clearTimeout(id);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      onCreated();
      onClose();
    } else {
      if (result.suggestions) {
        setSuggestions(result.suggestions);
        setAvailable(false);
      }
      try {
        setErrors(JSON.parse(result.message));
      } catch {
        toast.error(result.message);
      }
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div key="crear-staff" className="fixed inset-0 z-[7000] flex items-center justify-center p-4 font-[family-name:var(--font-poppins)]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-crear-staff"
            initial={{ scale: 0.98, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[2rem] bg-white p-8 text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="titulo-crear-staff" className="text-2xl font-semibold tracking-[-0.02em]">Nuevo usuario</h2>
                <p className="mt-1 text-sm text-[#57534e]">Tendrá acceso al panel con el rol que elijas.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e] transition-colors hover:bg-[#e7e5e4] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-nombre" className="text-sm font-medium text-[#292524]">Nombre completo</label>
                <input id="staff-nombre" name="fullName" required autoComplete="off" placeholder="Ej. Juan Pérez" className={`${inputClass} ${errors.fullName ? inputBad : inputOk}`} />
                {errors.fullName && <p className="text-sm text-red-700">{errors.fullName}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-usuario" className="text-sm font-medium text-[#292524]">Usuario</label>
                <input
                  id="staff-usuario"
                  name="username"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="juan.admin"
                  aria-describedby="staff-usuario-estado"
                  className={`${inputClass} ${available === false || errors.username ? inputBad : inputOk}`}
                />
                <div id="staff-usuario-estado" aria-live="polite" className="text-sm">
                  {errors.username ? (
                    <span className="text-red-700">{errors.username}</span>
                  ) : available === true ? (
                    <span className="text-green-700">Disponible</span>
                  ) : available === false ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-red-700">No disponible. Probá con:</span>
                      {suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setUsername(sug)}
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
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-rol" className="text-sm font-medium text-[#292524]">Rol</label>
                <select id="staff-rol" name="role" required defaultValue={Role.admin} className={`${inputClass} ${inputOk} cursor-pointer`}>
                  <option value={Role.admin}>Administrador: gestiona sus cursos</option>
                  <option value={Role.superadmin}>Superadministrador: acceso total</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-password" className="text-sm font-medium text-[#292524]">Contraseña</label>
                <div className="relative">
                  <input
                    id="staff-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className={`${inputClass} pr-12 ${errors.password ? inputBad : inputOk}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#57534e] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-700">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${pillButton} mt-2 h-12 bg-[#0a0a0a] text-white hover:bg-[#292524] disabled:cursor-wait disabled:opacity-80`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
                {loading ? "Creando…" : "Crear usuario"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type Pending = { type: "revoke" | "delete" } | null;

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [adminCourses, setAdminCourses] = useState<any>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [working, setWorking] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const session = await getCurrentUser();
      if (session?.role !== Role.superadmin) {
        router.push("/admin");
        return;
      }
      setAdmins(await getAdmins());
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el equipo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAdmin = async (admin: any) => {
    setSelectedAdmin(admin);
    setAdminCourses(null);
    setLoadingCourses(true);
    try {
      setAdminCourses(await getAdminCourses(admin.id));
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar sus cursos");
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedAdmin || !pending) return;
    setWorking(true);
    try {
      if (pending.type === "revoke") {
        await revokeAdminAccess(selectedAdmin.id);
        toast.success(`${selectedAdmin.fullName} ya no tiene acceso al panel`);
      } else {
        await deleteAdmin(selectedAdmin.id);
        toast.success("Cuenta eliminada");
      }
      setPending(null);
      setSelectedAdmin(null);
      setAdminCourses(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo completar la acción");
    } finally {
      setWorking(false);
    }
  };

  const filtered = admins.filter(
    (a) =>
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 py-2 text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Usuarios</h1>
          <p className="mt-1 text-[#57534e]">Tu equipo del panel: en qué cursos está cada uno y quién tiene acceso.</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className={`${pillButton} h-12 bg-[#0a0a0a] px-6 text-white hover:bg-[#292524]`}>
          <UserPlus size={16} aria-hidden="true" /> Crear usuario
        </button>
      </header>

      <div className="grid grid-cols-12 gap-5">
        {/* LISTA DEL EQUIPO */}
        <section className="col-span-4 rounded-[1.75rem] border border-[#e7e5e4] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="relative mb-3">
            <label htmlFor="buscar-staff" className="sr-only">Buscar usuario</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]" size={16} aria-hidden="true" />
            <input
              id="buscar-staff"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o usuario…"
              className={`${inputClass} ${inputOk} rounded-full pl-11`}
            />
          </div>
          <p className="px-2 pb-2 text-sm text-[#57534e]">
            {admins.length} {admins.length === 1 ? "administrador" : "administradores"}
          </p>
          {loading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#f5f5f4]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-[#57534e]">
              {search ? "Nadie coincide con esa búsqueda." : "Todavía no hay administradores. Creá el primero."}
            </p>
          ) : (
            <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
              {filtered.map((admin) => {
                const active = selectedAdmin?.id === admin.id;
                return (
                  <li key={admin.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectAdmin(admin)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                        active ? "bg-[#0a0a0a] text-white" : "hover:bg-[#f5f5f4]"
                      }`}
                    >
                      <Avatar name={admin.fullName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{admin.fullName}</p>
                        <p className={`truncate text-sm ${active ? "text-white/70" : "text-[#57534e]"}`}>@{admin.username}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${active ? "bg-white/15" : "bg-[#f5f5f4] text-[#57534e]"}`}>
                        {admin._count?.managedCourses ?? 0} {admin._count?.managedCourses === 1 ? "curso" : "cursos"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* DETALLE */}
        <section className="col-span-8 rounded-[1.75rem] border border-[#e7e5e4] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          {!selectedAdmin ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e]">
                <Users size={22} aria-hidden="true" />
              </span>
              <p className="mt-4 font-semibold">Elegí a alguien del equipo</p>
              <p className="mt-1 max-w-xs text-sm text-[#57534e]">Vas a ver los cursos que tiene a cargo, en cuáles colabora y cómo van sus inscripciones.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-[#e7e5e4] pb-5">
                <div className="flex items-center gap-4">
                  <Avatar name={selectedAdmin.fullName} size="h-14 w-14 text-xl" />
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em]">{selectedAdmin.fullName}</h2>
                    <p className="text-sm text-[#57534e]">
                      @{selectedAdmin.username} · Administrador desde {sinceDate(selectedAdmin.createdAt)}
                      {selectedAdmin._count?.articles ? ` · ${selectedAdmin._count.articles} artículos` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setPending({ type: "revoke" })}
                    className={`${pillButton} border border-[#e7e5e4] hover:bg-[#f5f5f4]`}
                  >
                    <ShieldOff size={16} aria-hidden="true" /> Quitar acceso
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending({ type: "delete" })}
                    aria-label={`Eliminar la cuenta de ${selectedAdmin.fullName}`}
                    title="Eliminar cuenta"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e5e4] text-red-700 transition-colors hover:border-red-700 hover:bg-[#fef2f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {loadingCourses || !adminCourses ? (
                <div className="space-y-3 pt-5" aria-busy="true">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#f5f5f4]" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6 pt-5">
                  <div>
                    <h3 className="font-semibold">
                      Cursos a cargo <span className="font-normal text-[#57534e]">· {adminCourses.created.length}</span>
                    </h3>
                    {adminCourses.created.length > 0 ? (
                      <ul className="divide-y divide-[#e7e5e4]">
                        {adminCourses.created.map((c: any) => (
                          <CourseRow key={c.id} course={c} detail={c.collaborators ? `Colaboran: ${c.collaborators}` : "Sin colaboradores"} />
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-[#57534e]">No tiene cursos propios.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Colabora en <span className="font-normal text-[#57534e]">· {adminCourses.collaborating.length}</span>
                    </h3>
                    {adminCourses.collaborating.length > 0 ? (
                      <ul className="divide-y divide-[#e7e5e4]">
                        {adminCourses.collaborating.map((c: any) => (
                          <CourseRow key={c.id} course={c} detail={`A cargo de ${c.createdBy}`} />
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-[#57534e]">No colabora en otros cursos.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <CreateStaffModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadData} />

      {/* CONFIRMACIÓN: QUITAR ACCESO / ELIMINAR */}
      <AnimatePresence>
        {pending && selectedAdmin && (
          <div key="confirmar-staff" className="fixed inset-0 z-[7000] flex items-center justify-center p-4 font-[family-name:var(--font-poppins)]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPending(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-confirmar-staff"
              initial={{ scale: 0.98, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-md rounded-[2rem] bg-white p-8 text-center text-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${pending.type === "delete" ? "bg-[#fef2f2] text-red-700" : "bg-[#fff7ed] text-[#C2410C]"}`}>
                {pending.type === "delete" ? <AlertTriangle size={24} aria-hidden="true" /> : <ShieldOff size={24} aria-hidden="true" />}
              </span>
              <h3 id="titulo-confirmar-staff" className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
                {pending.type === "delete" ? "¿Eliminar la cuenta?" : "¿Quitarle el acceso?"}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-[#57534e]">
                {pending.type === "delete" ? (
                  <>Se borran la cuenta de <span className="font-medium text-[#0a0a0a]">{selectedAdmin.fullName}</span> y sus artículos, y deja de figurar en sus cursos. No se puede deshacer.</>
                ) : (
                  <><span className="font-medium text-[#0a0a0a]">{selectedAdmin.fullName}</span> ya no podrá entrar al panel. Su cuenta y sus cursos se conservan.</>
                )}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPending(null)} disabled={working} className={`${pillButton} h-12 border border-[#e7e5e4] hover:bg-[#f5f5f4]`}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={working}
                  className={`${pillButton} h-12 text-white disabled:opacity-80 ${pending.type === "delete" ? "bg-red-700 hover:bg-red-800 focus-visible:ring-red-700" : "bg-[#0a0a0a] hover:bg-[#292524]"}`}
                >
                  {working && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {pending.type === "delete" ? "Eliminar" : "Quitar acceso"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
