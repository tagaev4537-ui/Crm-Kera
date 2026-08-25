import { PrismaClient } from "@prisma/client";

// Единственный экземпляр Prisma Client на всё приложение
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
