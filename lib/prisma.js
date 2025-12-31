import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

const connectionString = process.env.DATABASE_URL;

let pool;
let adapter;

// Only initialize if DATABASE_URL is available
// This allows build to succeed even if DATABASE_URL is not set during build time
if (connectionString) {
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
    // During build, connection errors are expected if DB is not available
    // Don't throw - will be initialized at runtime
    console.warn("Failed to create database pool during initialization:", error.message);
  }
}

// Create Prisma client with lazy initialization
export const prisma =
  globalForPrisma.prisma ||
  (() => {
    if (!connectionString) {
      // Return a proxy that will initialize on first use
      return new Proxy({}, {
        get(_target, prop) {
          const connString = process.env.DATABASE_URL;
          if (!connString) {
            throw new Error("DATABASE_URL environment variable is not set");
          }
          
          // Initialize now
          const p = new Pool({ 
            connectionString: connString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 15000,
            statement_timeout: 15000,
          });
          const a = new PrismaPg(p);
          const client = new PrismaClient({
            adapter: a,
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
          });
          
          const value = client[prop];
          if (typeof value === "function") {
            return value.bind(client);
          }
          return value;
        },
      });
    }
    
    if (!adapter) {
      // Retry initialization if it failed before
      try {
        pool = new Pool({ 
          connectionString,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 15000,
          statement_timeout: 15000,
        });
        adapter = new PrismaPg(pool);
      } catch (error) {
        throw new Error(`Failed to create database pool: ${error.message}`);
      }
    }
    
    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    
    return client;
  })();

