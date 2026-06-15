// prisma/seed.ts
import prisma from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

async function main() {
  const adminEmail = "pastor";
  const adminPassword = "12345678"; // En producción, usa variables de entorno

  // Hashear la contraseña antes de guardar
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  console.log("Iniciando el sembrado de datos (seeding)...");

  const admin = await prisma.user.upsert({
    where: { username: adminEmail },
    update: {}, // Si ya existe, no hace nada
    create: {
      username: adminEmail,
      fullName: "Administrador Principal",
      password: hashedPassword,
      role: "superadmin",
      rank: "miembro",
    },
  });

  console.log(`Usuario admin creado o actualizado: ${admin.username}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
