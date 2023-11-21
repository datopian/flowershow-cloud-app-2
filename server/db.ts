import { PrismaClient } from "@prisma/client";
import { env } from "@/env.mjs"

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient();

if (env.NODE_ENV === "development") global.prisma = db;

// TODO temp
export default db;
