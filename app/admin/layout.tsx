export const dynamic = 'force-dynamic';

import AdminClientLayout from "@/components/admin/AdminClientLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
