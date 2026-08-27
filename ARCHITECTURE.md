# 📐 Arquitectura del Sistema - Juntos Somos Iglesia

Este documento describe la arquitectura técnica, modelo de datos, flujo de autenticación, control de accesos (RBAC) y patrones de diseño utilizados en el proyecto **Juntos Somos Iglesia**.

---

## 1. Visión General de la Arquitectura

El sistema está estructurado sobre **Next.js 16.1 con App Router**, aplicando el patrón de **Server Actions** para la lógica de negocio, **Prisma ORM** como capa de acceso a datos, y control perimetral mediante **Proxy / Middleware**.

```mermaid
graph TD
    subgraph ClientTier["Capa de Presentación (Frontend)"]
        Landing["Landing Page (GSAP + Lenis + SmoothScroll)"]
        AdminApp["Panel de Administración (/admin)"]
        StudentApp["Aula Virtual del Estudiante (/dashboard-estudiante)"]
        PublicViews["Vistas Públicas (/eventos, /articulos, /testimonios)"]
    end

    subgraph SecurityTier["Capa Perimetral & Seguridad"]
        Proxy["Proxy Middleware (proxy.ts)"]
        JWTValidation["Validación JWT (jose HS256)"]
        SessionCookies["Cookies HttpOnly ('session_token')"]
    end

    subgraph BusinessTier["Capa de Negocio (Server Actions)"]
        AuthActions["actions/auth (login, logout, getCurrentUser)"]
        AdminActions["actions/admin (dashboard, colaboradores, roles)"]
        CourseActions["actions/course & actions/user_course (inscripción, progreso, exámenes)"]
        EventActions["actions/events/events.actions.ts (CRUD eventos, baja lógica)"]
        ImageActions["actions/events/images.actions.ts (Cloudinary, reglas por curso)"]
        ArticleActions["actions/articles (artículos, slugs, Tiptap)"]
        TestimonyActions["actions/testimony (testimonios de fe)"]
    end

    subgraph StorageTier["Capa de Datos y Multimedia"]
        PrismaORM["Prisma Client v7"]
        Database[(Base de Datos MySQL / MariaDB)]
        CloudinaryAPI["Cloudinary Cloud Storage (Galería / Eventos)"]
    end

    ClientTier -->|Petición HTTP / Cookies| Proxy
    Proxy -->|Inspección de Sesión & Redirección| ClientTier
    ClientTier -->|Invocación Server Action| BusinessTier
    BusinessTier -->|Validación RBAC en servidor| SecurityTier
    BusinessTier -->|Operaciones Type-Safe| PrismaORM
    BusinessTier -->|Uploads / Delete REST| CloudinaryAPI
    PrismaORM -->|Consultas SQL optimizadas| Database
```

---

## 2. Modelo de Datos y Entidades (ERD)

El esquema de base de datos (`prisma/schema.prisma`) modela la interacción entre usuarios, perfiles, cursos, lecciones en video, evaluaciones, artículos, testimonios, eventos e imágenes:

```mermaid
erDiagram
    User ||--o| Profile : "1:1 tiene"
    User ||--o{ CourseRegistration : "se inscribe en"
    User ||--o{ CourseManager : "administra / colabora en"
    User ||--o{ CourseVideo : "sube lecciones"
    User ||--o{ ExamAnswers : "responde preguntas"
    User ||--o{ UserVideoProgress : "registra avance de"
    User ||--o{ Article : "publica"
    User ||--o{ Testimony : "comparte"
    User ||--o{ Image : "sube fotos (opcional)"

    Course ||--o{ CourseManager : "posee gestores"
    Course ||--o{ CourseRegistration : "posee alumnos"
    Course ||--o{ CourseVideo : "contiene lecciones"
    Course ||--o{ Event : "vincula eventos formativos (opcional)"

    CourseVideo ||--o{ VideoReview : "contiene preguntas"
    CourseVideo ||--o{ UserVideoProgress : "registra progreso"

    VideoReview ||--o{ ExamAnswers : "recibe respuestas"

    Event ||--o{ Image : "contiene galería de fotos"

    User {
        String id PK
        String username UK
        String fullName
        String password
        Role role "superadmin | admin | user"
        Rank rank "concurre | miembro"
        DateTime createdAt
        DateTime updatedAt
    }

    Profile {
        String id PK
        String dni UK
        String phone
        String address
        String userId FK
    }

    Course {
        String id PK
        String name
        String description
        String accessCode
        Int quotaLimit
        DateTime openEnrollment
        DateTime deadline
    }

    CourseManager {
        String id PK
        String courseId FK
        String userId FK
        RoleInCourse roleInCourse "owner | editor"
    }

    CourseRegistration {
        String id PK
        String courseId FK
        String userId FK
        DateTime createdAt
    }

    CourseVideo {
        String id PK
        String title
        Int order
        String videoId
        String courseId FK
        String authorId FK
    }

    VideoReview {
        String id PK
        String question
        String videoId FK
        String optionA
        String optionB
        String optionC
        QuestionOption correctOption "A | B | C"
    }

    ExamAnswers {
        String id PK
        String questionId FK
        String userId FK
        QuestionOption response
        Boolean isCorrect
        Boolean isArchived
    }

    UserVideoProgress {
        String id PK
        String userId FK
        String videoId FK
        Boolean isCompleted
    }

    Event {
        String id PK
        String title
        String description
        DateTime date
        Boolean isActive "Baja lógica"
        String courseId FK "Opcional"
    }

    Image {
        String id PK
        String url
        String publicId UK
        Json tags
        Boolean isProtected
        Boolean isFavorite
        String eventId FK "Opcional"
        String uploadedById FK "Opcional"
    }

    Article {
        String id PK
        String title
        String slug UK
        String content
        String imageUrl
        String authorId FK
    }

    Testimony {
        String id PK
        String content
        String authorId FK
    }
```

---

## 3. Control de Acceso Basado en Roles (RBAC)

El sistema define 3 roles de usuario jerárquicos:

1. **`superadmin`**:
   - Acceso total a todas las secciones del sistema.
   - Administración de usuarios y administradores.
   - Gestión de cursos, artículos, testimonios, eventos y galería.
2. **`admin`**:
   - Gestión y creación de cursos (como dueño `owner` o colaborador `editor`).
   - Gestión integral de eventos (creación, edición, baja lógica, restauración).
   - Gestión de imágenes (favoritas, proteger, editar, eliminar).
   - Monitoreo de estadísticas de cursos y alumnos.
3. **`user` (Estudiante / Miembro)**:
   - Inscripción a cursos mediante código de acceso.
   - Visualización de videos y resolución de cuestionarios.
   - Subida de imágenes a eventos vinculados a los cursos en los que está inscripto.
4. **Público General (Sin Sesión)**:
   - Navegación en Landing Page, Prédicas, Artículos y Testimonios públicos.
   - Consulta de cartelera de eventos activos.
   - Subida de fotos anónimas a la galería general o eventos no restringidos por curso.

---

## 4. Arquitectura del Módulo de Eventos & Galería Cloudinary

### Reglas de Negocio para Subida de Imágenes

```mermaid
flowchart TD
    Start[Usuario intenta subir imagen] --> HasEvent{¿Se especificó un eventId?}
    
    HasEvent -- No --> AllowFree[Subida permitida: Imagen general de la iglesia]
    
    HasEvent -- Sí --> CheckEventExists{¿El evento existe y está activo?}
    CheckEventExists -- No --> RejectNotFound[Error: Evento inactivo o inexistente]
    
    CheckEventExists -- Sí --> HasCourse{¿El evento está vinculado a un curso?}
    HasCourse -- No --> AllowGeneralEvent[Subida permitida: Evento abierto al público]
    
    HasCourse -- Sí --> CheckAuth{¿Usuario autenticado?}
    CheckAuth -- No --> DenyAnon[Error: Requiere iniciar sesión e inscripción en el curso]
    
    CheckAuth -- Sí --> CheckRole{¿Es Admin o SuperAdmin?}
    CheckRole -- Sí --> AllowAdmin[Subida permitida con privilegios de administrador]
    
    CheckRole -- No --> CheckEnrollment{¿Está inscripto en el curso del evento?}
    CheckEnrollment -- Sí --> AllowEnrolled[Subida permitida: Alumno verificado del curso]
    CheckEnrollment -- No --> DenyUnenrolled[Error: Solo alumnos inscriptos pueden subir fotos]
```

### Ciclo de Vida y Baja Lógica de Eventos

- **Creación**: Registrado con `isActive: true`.
- **Baja Lógica (`deleteEvent`)**: En lugar de ejecutar `DELETE` SQL destructivo, se actualiza `isActive: false`.
  - Las consultas públicas (`getEvents`, `getEventById`) ignoran automáticamente eventos inactivos.
  - El panel de administración puede consultar eventos inactivos y restaurarlos (`restoreEvent`).

---

## 5. Estructura de Directorios

```
juntos-somos-iglesia/
├── actions/                         # Server Actions (Capa de Negocio)
│   ├── admin/                       # Estadísticas y gestión de administradores
│   ├── articles/                    # Publicación y edición de artículos
│   ├── auth/                        # Login, logout y sesiones JWT
│   ├── course/                      # Gestión de cursos, videos y evaluaciones
│   ├── events/                      # Módulos de Eventos e Imágenes Cloudinary
│   │   ├── events.actions.ts        # Server Actions de Eventos (CRUD, baja lógica)
│   │   └── images.actions.ts        # Server Actions de Imágenes (Upload, favoritas, Cloudinary)
│   ├── testimony/                   # Gestión de testimonios
│   ├── user_course/                 # Inscripción rápida y cuestionarios de alumnos
│   └── user.ts                      # Validaciones de sesión y jerarquía de roles
├── app/                             # Rutas de Next.js (App Router)
│   ├── admin/                       # Panel de administración protegido
│   ├── articulos/                   # Vistas públicas de artículos y blog
│   ├── cursos/                      # Catálogo público de programas formativos
│   ├── dashboard-estudiante/        # Aula virtual interactiva del alumno
│   ├── login/                       # Autenticación y registro de alumnos
│   ├── testimonios/                 # Galería pública de testimonios
│   ├── layout.tsx                   # Layout raíz global
│   ├── page.tsx                     # Landing page principal animada (GSAP + Lenis)
│   └── globals.css                  # Estilos Tailwind CSS v4 globales
├── components/                      # Componentes UI de React
│   ├── admin/                       # Componentes exclusivos del panel admin
│   ├── student/                     # Componentes del aula virtual y visor de video
│   ├── Navbar.tsx                   # Barra de navegación principal animada
│   ├── SmoothScroll.tsx             # Integración con Lenis Smooth Scroll
│   └── ...                          # Componentes de secciones públicas
├── lib/                             # Helpers, utilidades y tipos
│   ├── helpers/                     # Validaciones de formularios y lógica auxiliar
│   │   └── events/                  # Validaciones para eventos e imágenes
│   ├── types/                       # Definiciones e interfaces de TypeScript
│   │   └── events.definitions.ts    # Tipos para eventos, imágenes y filtros
│   ├── utils/                       # Utilidades de integración (Cloudinary, slug, etc.)
│   │   └── cloudinary.ts            # Cliente REST para Cloudinary
│   └── prisma.ts                    # Instancia singleton del cliente Prisma
├── prisma/                          # Esquema de base de datos y migraciones
│   ├── schema.prisma                # Definición de modelos y relaciones
│   └── seed.ts                      # Seeder seguro del superadministrador inicial
├── proxy.ts                         # Middleware perimetral de rutas y roles
├── package.json                     # Dependencias y scripts del proyecto
└── README.md                        # Documentación de inicio y configuración
```
