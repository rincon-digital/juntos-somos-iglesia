"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, BookOpen, FileText, Star, Users, Home } from "lucide-react";
import { logout } from "@/actions/auth/auth";
import Image from "next/image";
import { validateSessionUser } from "@/actions/user";
import { Role } from "@/lib/types/definitions";

const navItems = [
  { label: "Inicio", href: "/admin", icon: Home, roles: [Role.admin, Role.superadmin] },
  {
    label: "Programas",
    href: "/admin/courses",
    icon: BookOpen,
    roles: [Role.admin, Role.superadmin],
  },
  { label: "Artículos", href: "/admin/articles", icon: FileText, roles: [Role.superadmin] },
  { label: "Testimonios", href: "/admin/testimony", icon: Star, roles: [Role.superadmin] },
  { label: "Usuarios", href: "/admin/usuarios", icon: Users, roles: [Role.superadmin] },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      const session = await validateSessionUser();
      if (session?.role) {
        setUserRole(session.role as Role);
      }
    };
    fetchRole();
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login-admin";
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
  };

  const filteredNavItems = navItems.filter(
    (item) => userRole && item.roles.includes(userRole),
  );

  return (
    <div className="flex flex-col gap-6 mb-8 w-full">
      <div className="w-full flex justify-center">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-between items-center w-full max-w-5xl bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl transition-all duration-500"
        >
          {/* LOGO */}
          <div className="flex items-center gap-3 group">
            <div className="bg-[#FF6B00] rounded-full w-9 h-9 flex items-center justify-center">
              <Image
                src="/Logo.webp"
                alt="Logo"
                width={20}
                height={20}
                className="brightness-0 invert"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white/40 font-black uppercase text-[8px] tracking-tighter">
                PANEL
              </span>
              <span className="text-[#FF6B00] font-black uppercase tracking-tighter italic text-lg">
                {userRole === Role.superadmin ? "SUPER ADMIN" : "ADMIN"}
              </span>
            </div>
          </div>

          {/* MENU DESKTOP */}
          <div className="hidden lg:flex items-center gap-2">
            {filteredNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-2 px-3 py-2 transition-all font-bold uppercase tracking-[0.15em] text-[9px] relative ${
                    isActive ? "text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  <Icon size={12} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="adminNavUnderline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FF6B00]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* BOTON MENU MOBILE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/70 hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* LOGOUT - solo desktop */}
          <button
            onClick={handleLogout}
            className="hidden lg:flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-black uppercase tracking-widest text-[9px] transition-all hover:bg-[#FF6B00] hover:text-white"
          >
            <LogOut size={10} />
            <span className="hidden xl:inline">Cerrar Sesión</span>
          </button>
        </motion.nav>
      </div>

      {/* MENU MOBILE */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-0 top-24 z-50 mx-4 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            style={{ position: 'fixed', top: '5rem' }}
          >
            <div className="p-2 space-y-1 mt-2">
              {filteredNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase tracking-[0.15em] text-[10px] ${
                      isActive
                        ? "bg-[#FF6B00]/20 text-[#FF6B00]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
              <hr className="border-white/10 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase tracking-[0.15em] text-[10px] text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}