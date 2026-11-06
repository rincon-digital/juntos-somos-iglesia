"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "@/lib/toast";
import AdminHeader from "@/components/admin/AdminHeader";
import { getCurrentUser } from "@/actions/auth/auth";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (
        !currentUser ||
        (currentUser.role !== "admin" && currentUser.role !== "superadmin")
      ) {
        router.push("/login-admin");
        return;
      }
      setUser(currentUser);
    };
    checkUser();
  }, [router]);

  // Secciones ya rediseñadas en claro; el resto sigue en oscuro por ahora
  const isLight = ["/admin", "/admin/courses", "/admin/articles", "/admin/testimony", "/admin/usuarios"].includes(pathname);
  const shell = isLight ? "bg-[#fafaf9] text-[#0a0a0a]" : "bg-[#070707] text-white";

  // Si aún está cargando el usuario, evitamos flashes de contenido
  if (!user) return <div className={`${shell} min-h-screen`} />;

  return (
    <main className={`${shell} min-h-screen p-4 pb-28 md:p-7 md:pb-28 lg:pb-7 lg:pl-28`}>
      <Toaster position="bottom-right" richColors theme="dark" />

      {/* Cápsula de navegación */}
      <AdminHeader />

      {/* Contenido dinámico de las páginas */}
      <div className="mx-auto min-h-[60vh] max-w-[1280px]">{children}</div>
    </main>
  );
}
