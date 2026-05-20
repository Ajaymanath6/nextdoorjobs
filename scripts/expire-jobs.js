/**
 * Soft-expire job postings (isActive=false). Companies are not removed.
 *
 *   npm run jobs:expire           — only jobs past effective expiry
 *   npm run jobs:expire -- --all  — every currently active job (one-time cleanup)
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { expireStaleJobs } from "../lib/jobExpiry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const allActive = process.argv.includes("--all");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 60_000 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const mode = allActive ? "all active jobs" : "expired jobs only";
  console.log(`Expiring: ${mode}...`);

  const { count, ids } = await expireStaleJobs(prisma, { allActive, now: new Date() });

  console.log(`Soft-deleted ${count} job posting(s).`);
  if (count > 0 && count <= 20) {
    console.log("Job IDs:", ids.join(", "));
  } else if (count > 20) {
    console.log(`Job IDs (first 20): ${ids.slice(0, 20).join(", ")}...`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
