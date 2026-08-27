# ⛪ Juntos Somos Iglesia

Plataforma web integral para la comunidad e iglesia **Juntos Somos Iglesia**, construida con tecnologías web modernas, arquitectura full-stack de alto rendimiento, sistema de aprendizaje interactivo (LMS), gestión de eventos, artículos, testimonios y panel de administración avanzado.

---

## 🚀 Tecnologías Principales

- **Framework**: [Next.js 16.1 (App Router)](https://nextjs.org/)
- **Librería UI**: [React 19](https://react.dev/)
- **Base de Datos & ORM**: [Prisma ORM](https://www.prisma.io/) + MySQL / MariaDB
- **Estilos & Animaciones**: 
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [GSAP (GreenSock)](https://gsap.com/) + ScrollTrigger
  - [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll)
  - [Framer Motion](https://www.framer.com/motion/)
- **Autenticación & Seguridad**: JWT sin estado con [`jose`](https://github.com/panva/jose) + `bcryptjs` en Cookies HttpOnly y Proxy/Middleware.
- **Gestión Multimedia**: [Cloudinary](https://cloudinary.com/) (Imágenes de eventos y galería) + ImgBB + React Player.
- **Editor Enriquecido**: [Tiptap Core & Starter Kit](https://tiptap.dev/).

---

## 📦 Módulos y Funcionalidades

### 1. 🌟 Experiencia Pública (Landing Page)
- Hero interactivo con animaciones GSAP y scroll cinematográfico (Lenis).
- Sección de Prédicas y transmisiones en vivo.
- Catálogo interactivo de Programas / Cursos.
- Cartelera de Testimonios y Artículos doctrinales/formativos.
- Módulo público de **Eventos y Galería de Fotos**.

### 2. 🔐 Autenticación & Control de Acceso (RBAC)
- Jerarquía de roles: `superadmin`, `admin`, `user` (alumno/miembro).
- Rango de membresía: `miembro`, `concurre`.
- Middleware perimetral ([proxy.ts](file:///proxy.ts)) que redirige automáticamente según el rol autenticado.

### 3. 🎓 Plataforma de Cursos y Evaluaciones (LMS)
- Control de cupos y fechas límite de inscripción con código de acceso.
- Gestión de colaboradores y permisos por curso (`owner` / `editor`).
- Reproductor de lecciones en video con seguimiento de progreso por alumno.
- Cuestionarios evaluativos dinámicos por video lección con estadísticas en tiempo real y bloqueo tras aprobación.

### 4. 📅 Eventos y Galería Multimedia (Cloudinary)
- Creación y edición de eventos (exclusivo `admin` y `superadmin`).
- **Baja lógica** de eventos (`isActive: false`).
- Relación opcional Evento ↔ Curso.
- **Subida de fotos libre**: Visitantes anónimos y registrados pueden subir fotos a eventos generales o galería libre.
- **Seguridad por curso**: En eventos vinculados a un curso, solo los alumnos inscriptos en dicho curso (o admins) pueden subir fotos.
- **Gestión exclusiva admin**: Marcar imágenes favoritas, proteger fotos, editar tags y eliminación física en Cloudinary.

### 5. 📰 Artículos & Testimonios
- Editor de texto enriquecido (WYSIWYG con Tiptap).
- Gestión de testimonios de fe y moderación.

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd juntos-somos-iglesia
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basado en el siguiente formato:

```env
# Conexión a la Base de Datos
DATABASE_URL="mysql://usuario:password@localhost:3306/nombre_db"

# Seguridad JWT
JWT_SECRET="tu_clave_secreta_super_segura_aqui"

# Entorno
NODE_ENV="development"

# Cloudinary (Imágenes de eventos y galería)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="tu_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="tu_preset_opcional"

# Variables para Seeder del Administrador
adminEmail="ageu@juntossomosiglesia.com"
adminPassword="TuPasswordSegura"
adminName="Pastor Ageu da Rosa"
```

### 4. Migrar la Base de Datos y Generar Cliente Prisma
```bash
npx prisma db push
# o npx prisma migrate dev
```

### 5. Sembrar la Base de Datos (Crear Superadmin Inicial)
```bash
npm run seed
# o npx prisma db seed
```

### 6. Ejecutar en Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📜 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo de Next.js. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run start` | Inicia el servidor optimizado de producción. |
| `npm run seed` | Ejecuta el seeder para crear/actualizar el superadministrador inicial. |
| `npm run lint` | Ejecuta ESLint para validar el código. |

---

## 🏛️ Documentación de Arquitectura

Para consultar la arquitectura detallada del sistema, el diagrama de base de datos (ERD), el flujo de autorización y la matriz de responsabilidades, consulta [ARCHITECTURE.md](./ARCHITECTURE.md).
