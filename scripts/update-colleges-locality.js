import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const collegeUpdates = [
  { name: "Government Engineering College (GEC)", locality: "Ramavarmapuram" },
  { name: "Sri C. Achutha Menon Government College", locality: "Kuttanellur" },
  { name: "KKTM Government College, Pullut", locality: "Pullut" },
  { name: "Panampilly Memorial Govt. College (PMGC)", locality: "Potta" },
  { name: "Government Arts & Science College, Ollur", locality: "Christopher Nagar" },
  { name: "Government Arts & Science College, Chelakkara", locality: "Killimangalam" },
  { name: "Government Law College, Thrissur", locality: "Ayyanthole" },
  { name: "Government College of Fine Arts", locality: "Chembukkav" },
  { name: "Maharaja's Technological Institute (MTI)", locality: "Chembukkav" },
  { name: "Sree Rama Government Polytechnic College", locality: "Valapad" },
  { name: "Govt. Women's Polytechnic College, Thrissur", locality: "Nedupuzha" },
  { name: "Government Polytechnic College, Koratty", locality: "Koratty" },
  { name: "Government Polytechnic College, Kunnamkulam", locality: "Kizoor" },
  { name: "Government Polytechnic College, Chelakkara", locality: "Thonoorkkara" },
];

async function main() {
  console.log("🌱 Starting to update colleges with locality data...");
  console.log(`📊 Total colleges to update: ${collegeUpdates.length}`);

  try {
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const update of collegeUpdates) {
      try {
        const result = await prisma.college.updateMany({
          where: {
            name: update.name,
          },
          data: {
            locality: update.locality,
          },
        });

        if (result.count > 0) {
          updatedCount++;
          console.log(`✅ Updated: ${update.name} → ${update.locality}`);
        } else {
          notFoundCount++;
          console.log(`⚠️  Not found: ${update.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${update.name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} colleges`);
    if (notFoundCount > 0) {
      console.log(`   ⚠️  Not found: ${notFoundCount} colleges`);
    }

    // Verify the updates
    const collegesWithLocality = await prisma.college.count({
      where: {
        locality: { not: null },
      },
    });

    console.log(`\n📋 Colleges with locality data: ${collegesWithLocality}`);
    
  } catch (error) {
    console.error("❌ Error updating colleges:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .then(() => {
    console.log("\n✨ Update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
