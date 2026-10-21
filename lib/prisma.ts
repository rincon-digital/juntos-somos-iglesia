import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// Definimos una función para crear la instancia
const prismaClientSingleton = () => {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({ adapter, log: ["query"] });
};

const PRISMA_SCHEMA_VERSION = "v2_course_isActive";

// Declaramos un tipo para el objeto global para evitar errores de TypeScript
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  var prismaSchemaVersion: undefined | string;
}

// Si el esquema cambió en caliente (Hot Reload), recreamos el cliente Prisma
if (
  globalThis.prismaGlobal &&
  globalThis.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION
) {
  globalThis.prismaGlobal.$disconnect().catch(() => {});
  globalThis.prismaGlobal = undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// En entornos que no son de producción, guardamos la instancia en globalThis
// para que sobreviva a las recargas de código (Hot Reloading)
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
  globalThis.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
