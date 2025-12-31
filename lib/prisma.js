import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

let pool;
let adapter;

try {
  pool = new Pool({ 
    connectionString,
    max: 20, // Increased pool size for better concurrency
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 15000, // Increased to 15 seconds
    statement_timeout: 15000, // 15 second query timeout
  });
  adapter = new PrismaPg(pool);
} catch (error) {
  console.error("Failed to create database pool:", error);
  throw error;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

