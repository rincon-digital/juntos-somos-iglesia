"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
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

  // Si aún está cargando el usuario, evitamos flashes de contenido
  if (!user) return <div className="bg-[#070707] min-h-screen" />;

  return (
    <main className="bg-[#070707] min-h-screen text-white p-4 md:p-7">
      <Toaster position="bottom-right" richColors theme="dark" />

      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header con info del pastor y reloj */}
        <AdminHeader />

        {/* Contenido dinámico de las páginas */}
        <div className="min-h-[60vh]">{children}</div>
      </div>
    </main>
  );
}
