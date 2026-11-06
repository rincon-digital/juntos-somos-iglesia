"use client";
// Adaptador: mantiene la API que usaba sonner (toast.success, toast.error, toast.loading, { id })
// pero muestra los avisos con Sileo. Así las páginas solo cambian el import.
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { sileo, Toaster as SileoToaster } from "sileo";

type ToastOptions = {
  description?: ReactNode;
  // Si viene, reemplaza al aviso con ese id (por ejemplo, el de "cargando")
  id?: string;
  duration?: number;
};

type Kind = "success" | "error" | "warning" | "info";

function show(kind: Kind, message: ReactNode, options?: ToastOptions) {
  if (options?.id) sileo.dismiss(options.id);
  return sileo[kind]({
    title: String(message),
    description: options?.description,
    duration: options?.duration,
  });
}

export const toast = {
  success: (message: ReactNode, options?: ToastOptions) => show("success", message, options),
  error: (message: ReactNode, options?: ToastOptions) => show("error", message, options),
  warning: (message: ReactNode, options?: ToastOptions) => show("warning", message, options),
  info: (message: ReactNode, options?: ToastOptions) => show("info", message, options),
  // Sileo no tiene "loading" suelto: queda fijo hasta que otro aviso lo reemplaza con su id
  loading: (message: ReactNode, options?: ToastOptions) => {
    if (options?.id) sileo.dismiss(options.id);
    return sileo.show({
      title: String(message),
      description: options?.description,
      type: "loading",
      duration: null,
      icon: <Loader2 size={14} className="animate-spin" aria-hidden="true" />,
    });
  },
  dismiss: (id?: string) => (id ? sileo.dismiss(id) : sileo.clear()),
};

// Los <Toaster> que quedaron en las páginas ya no dibujan nada: hay uno solo en app/layout.tsx,
// porque Sileo muestra cada aviso en todos los Toaster montados y se duplicarían.
export function Toaster(_props: Record<string, unknown>) {
  return null;
}

export function AppToaster() {
  return <SileoToaster position="top-right" theme="light" />;
}
