/**
 * One-time seed: create the "admin owner" user used as userId for admin-created companies and jobs.
 * Run: npm run db:seed-admin-owner (or node scripts/seed-admin-owner.js)
 * Then set ADMIN_OWNER_USER_ID=<id> in .env.local, or use ADMIN_OWNER_EMAIL=admin-owner@internal
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 60000 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_OWNER_EMAIL = process.env.ADMIN_OWNER_EMAIL || "admin-owner@internal";
const ADMIN_OWNER_NAME = "Admin Owner";

async function seedAdminOwner() {
  console.log("Creating admin owner user (for admin-created companies/jobs)...");
  const email = ADMIN_OWNER_EMAIL.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (existing) {
    console.log("Admin owner user already exists:");
    console.log("  id:", existing.id);
    console.log("  email:", existing.email);
    console.log("Set ADMIN_OWNER_USER_ID=" + existing.id + " in .env.local (or use ADMIN_OWNER_EMAIL=" + email + ")");
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: ADMIN_OWNER_NAME,
      clerkId: null,
      accountType: null,
    },
    select: { id: true, email: true },
  });

  console.log("Created admin owner user:");
  console.log("  id:", user.id);
  console.log("  email:", user.email);
  console.log("Set ADMIN_OWNER_USER_ID=" + user.id + " in .env.local (or use ADMIN_OWNER_EMAIL=" + user.email + ")");
  await prisma.$disconnect();
}

seedAdminOwner().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
