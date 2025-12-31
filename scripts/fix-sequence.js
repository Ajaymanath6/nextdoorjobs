import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
config({ path: ".env.local", override: true });
config({ path: ".env" });

// Initialize Prisma Client
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

async function fixSequence() {
  console.log("🔧 Fixing auto-increment sequence...");

  try {
    // Get the maximum ID from the pincodes table using Prisma
    const maxRecord = await prisma.pincode.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    
    const maxId = maxRecord?.id || 0;
    const nextId = maxId + 1;

    console.log(`📊 Current maximum ID: ${maxId}`);
    console.log(`🔢 Setting sequence to start from: ${nextId}`);

    // Reset the sequence using raw SQL with the pool directly
    const result = await pool.query(
      `SELECT setval('pincodes_id_seq', $1, false)`,
      [nextId]
    );

    console.log(`✅ Sequence fixed! Next insert will use ID: ${nextId}`);
  } catch (error) {
    console.error("❌ Error fixing sequence:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

fixSequence()
  .then(() => {
    console.log("\n✨ Sequence fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Sequence fix failed:", error);
    process.exit(1);
  });

