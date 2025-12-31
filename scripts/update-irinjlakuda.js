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

async function updateIrinjalakuda() {
  console.log("🔄 Updating Irinjalakuda in database...");

  try {
    // Update pincode 680121 to have just "Irinjalakuda"
    const updated = await prisma.pincode.update({
      where: { pincode: "680121" },
      data: {
        localityName: "Irinjalakuda",
        district: "Thrissur",
        state: "Kerala",
      },
    });

    console.log("✅ Updated pincode 680121:");
    console.log(`   Locality: ${updated.localityName}`);
    console.log(`   District: ${updated.district}`);
    console.log(`   State: ${updated.state}`);
    console.log(`   Pincode: ${updated.pincode}`);

    // Verify the update
    const verify = await prisma.pincode.findUnique({
      where: { pincode: "680121" },
    });

    console.log("\n✅ Verification:");
    console.log(`   Found: ${verify.localityName} (${verify.pincode})`);
  } catch (error) {
    console.error("❌ Error updating Irinjalakuda:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

updateIrinjalakuda()
  .then(() => {
    console.log("\n✨ Update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Update failed:", error);
    process.exit(1);
  });

