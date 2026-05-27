import ClientLayout from "./ClientLayout";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
