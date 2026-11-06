"use client";
import CourseCommandCenter from "@/components/admin/Course/CourseCommandCenter";

// Sección Programas: enfocada en administrar cada curso, sin métricas (esas viven en el inicio del panel)
export default function CoursePage() {
  return (
    <div className="space-y-6 py-2 font-[family-name:var(--font-poppins)]">
      <header>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Programas</h1>
        <p className="mt-1 text-[#57534e]">Administrá tus cursos: alumnos, contenido, colaboradores y código de acceso.</p>
      </header>
      <CourseCommandCenter />
    </div>
  );
}
