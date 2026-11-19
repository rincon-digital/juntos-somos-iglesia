# Cambios de base de datos pendientes para producción

Rama `fix-frontend` · noviembre 2026

## ⚠️ No usar `npx prisma db push` en producción

La base tiene datos que `schema.prisma` no conoce:

- la columna `email` en la tabla `user`
- la tabla `events`
- la tabla `images`

Si corrés `prisma db push`, Prisma **borra** esa columna y esas tablas con sus datos para dejar la base igual al schema. En la base local se frenó solo, pidiendo `--accept-data-loss`. Nunca pases ese flag.

**Cómo hacerlo:** correr el SQL de abajo a mano, una sola vez, en la base de producción (desde phpMyAdmin, MySQL Workbench o la consola). Los dos cambios solo **agregan**: no tocan ni borran nada de lo que ya existe.

Antes, sacá una copia de la base (exportar / `mysqldump`).

---

## 1. Retomar el video donde quedó el alumno

Columna nueva `lastPosition` en `UserVideoProgress`: guarda el segundo donde quedó el alumno, para que al volver le aparezca "Seguir desde 12:34" / "Empezar de nuevo".

```sql
ALTER TABLE `uservideoprogress`
  ADD COLUMN `lastPosition` INT NOT NULL DEFAULT 0;
```

## 2. Opiniones de las clases (caritas)

Tabla nueva `ClassFeedback`: cuando el alumno aprueba una clase elige 😀 Me gustó / 😐 Regular / 😕 No me gustó, con un comentario opcional. El pastor lo ve en Programas → Ver curso → Contenido → Opiniones.

```sql
CREATE TABLE IF NOT EXISTS `ClassFeedback` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `videoId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ClassFeedback_userId_videoId_key` (`userId`, `videoId`),
  KEY `ClassFeedback_videoId_fkey` (`videoId`),
  CONSTRAINT `ClassFeedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClassFeedback_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `coursevideo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Mayúsculas en los nombres de tabla:** en Windows MySQL guarda todo en minúscula (`uservideoprogress`, `user`, `coursevideo`). En un servidor Linux puede que se llamen `UserVideoProgress`, `User`, `CourseVideo`. Si el SQL da "table doesn't exist", corré `SHOW TABLES;` y usá el nombre exacto que aparezca.

## 3. Fechas de cursos creados antes de este cambio

Las fechas de apertura y cierre ahora se guardan en hora de Argentina: apertura a las 00:00 y cierre a las 23:59. Los cursos creados antes quedaron guardados a la medianoche UTC y se ven **un día antes** (si elegiste el 20, figura el 19).

En la base local ya están corregidos. En producción se corrige así, solo para las fechas guardadas con el formato viejo (hora exacta 00:00:00):

```sql
-- Ver primero qué cambiaría
SELECT id, name, openEnrollment, deadline FROM `course`
WHERE TIME(openEnrollment) = '00:00:00' OR TIME(deadline) = '00:00:00';

-- Apertura: 00:00 de Argentina = 03:00 UTC del mismo día
UPDATE `course` SET openEnrollment = DATE_ADD(openEnrollment, INTERVAL 3 HOUR)
WHERE TIME(openEnrollment) = '00:00:00';

-- Cierre: 23:59:59 de Argentina = 02:59:59 UTC del día siguiente
UPDATE `course` SET deadline = DATE_ADD(deadline, INTERVAL '26:59:59' HOUR_SECOND)
WHERE TIME(deadline) = '00:00:00';
```

## Orden para publicar

1. Copia de la base de producción.
2. Correr el SQL de los puntos 1 y 2.
3. Revisar y correr el punto 3.
4. Publicar el código de `fix-frontend`. En el deploy no tiene que correr `prisma db push`; `prisma generate` sí (ya está en `postinstall`).
5. Probar: un alumno mira una clase, sale y vuelve ("Seguir desde…"); aprueba una clase y aparece la ventana de caritas.

## A futuro

Para que esto no vuelva a pasar, conviene que el schema refleje lo que ya existe (`npx prisma db pull` en una copia de la base, revisar las diferencias) y empezar a usar migraciones (`prisma migrate`) en vez de `db push`.
