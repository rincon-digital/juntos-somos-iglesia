"use client";
import { Toaster } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminClientLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  if (!user) return <div className="bg-[#070707] min-h-screen" />;

  return (
    <main className="bg-[#070707] min-h-screen text-white p-4 md:p-7">
      <Toaster position="bottom-right" richColors theme="dark" />

      <div className="max-w-[1280px] mx-auto space-y-6">
        <AdminHeader userRole={user.role} />
        <div className="min-h-[60vh]">{children}</div>
      </div>
    </main>
  );
}
