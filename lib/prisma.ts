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

// Declaramos un tipo para el objeto global para evitar errores de TypeScript
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Si ya existe la instancia en el objeto global, la usamos; si no, la creamos
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// En entornos que no son de producción, guardamos la instancia en globalThis
// para que sobreviva a las recargas de código (Hot Reloading)
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
