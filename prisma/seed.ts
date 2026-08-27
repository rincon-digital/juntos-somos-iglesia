// prisma/seed.ts
import "dotenv/config";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

async function main() {
  // Carga de credenciales desde variables de entorno con valores por defecto seguros
  const adminEmail =
    process.env.adminEmail || process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword =
    process.env.adminPassword || process.env.ADMIN_PASSWORD || "12345678";
  const adminName =
    process.env.adminName || process.env.ADMIN_NAME || "admin";

  console.log("Iniciando el sembrado de datos (seeding)...");

  // Hashear la contraseña antes de persistir
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminEmail },
    update: {
      fullName: adminName,
      password: hashedPassword,
      role: "superadmin",
    },
    create: {
      username: adminEmail,
      fullName: adminName,
      password: hashedPassword,
      role: "superadmin",
      rank: "miembro",
    },
  });

  console.log(`Usuario superadministrador listo: ${admin.username}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error durante el seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
