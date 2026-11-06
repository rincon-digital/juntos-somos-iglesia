"use client";
// Navegación del admin: cápsula flotante (a la izquierda en escritorio, abajo en celular)
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, BookOpen, FileText, Star, Users, Home, Settings } from "lucide-react";
import { logout } from "@/actions/auth/auth";
import { validateSessionUser } from "@/actions/user";
import { Role } from "@/lib/types/definitions";

const navItems = [
  { label: "Inicio", href: "/admin", icon: Home, roles: [Role.admin, Role.superadmin] },
  { label: "Programas", href: "/admin/courses", icon: BookOpen, roles: [Role.admin, Role.superadmin] },
  { label: "Artículos", href: "/admin/articles", icon: FileText, roles: [Role.superadmin] },
  { label: "Testimonios", href: "/admin/testimony", icon: Star, roles: [Role.superadmin] },
  { label: "Usuarios", href: "/admin/usuarios", icon: Users, roles: [Role.superadmin] },
  { label: "Configuración", href: "/admin/settings", icon: Settings, roles: [Role.admin, Role.superadmin] },
];

const itemBase =
  "group relative flex h-11 w-11 items-center justify-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

// Etiqueta que aparece al pasar el mouse (solo escritorio)
function HoverLabel({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 ml-4 hidden -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#0a0a0a] px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 lg:block">
      {text}
    </span>
  );
}

export default function AdminHeader() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const session = await validateSessionUser();
      if (session?.role) setUserRole(session.role as Role);
    };
    fetchRole();
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const items = navItems.filter((item) => userRole && item.roles.includes(userRole));

  return (
    <motion.nav
      aria-label="Navegación del panel"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-1 rounded-full bg-[#0a0a0a] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.25)] font-[family-name:var(--font-poppins)] lg:inset-x-auto lg:bottom-auto lg:left-5 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:gap-1.5 lg:p-2"
    >
      <Link
        href="/"
        aria-label="Ir a la web de la iglesia"
        className={`${itemBase} mb-1 hidden bg-[#FF6B00] lg:flex`}
      >
        <img src="/Logo.webp" alt="" aria-hidden="true" className="h-5 w-5 brightness-0 invert" />
        <HoverLabel text="Ver la web" />
      </Link>

      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`${itemBase} ${isActive ? "text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            {isActive && (
              <motion.span
                layoutId="admin-nav-activo"
                className="absolute inset-0 rounded-full bg-[#FF6B00]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              />
            )}
            <Icon size={18} className="relative" aria-hidden="true" />
            <HoverLabel text={item.label} />
          </Link>
        );
      })}

      <span aria-hidden="true" className="mx-1 h-6 w-px bg-white/15 lg:mx-0 lg:my-1 lg:h-px lg:w-6" />

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        className={`${itemBase} text-white/70 hover:bg-red-500/20 hover:text-red-300`}
      >
        <LogOut size={18} aria-hidden="true" />
        <HoverLabel text="Cerrar sesión" />
      </button>
    </motion.nav>
  );
}
