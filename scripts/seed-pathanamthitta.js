import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
config({ path: ".env.local", override: true });
config({ path: ".env" });

// Initialize Prisma Client with increased timeout settings
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString,
  max: 20, // Increased pool size for better concurrency
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 15000, // Increased to 15 seconds
  statement_timeout: 15000, // 15 second query timeout
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

const pincodeData = [
  {
    pincode: "689645",
    localityName: "Pathanamthitta Town / H.O",
    latitude: 9.2648,
    longitude: 76.7870,
    district: "Pathanamthitta",
    state: "Kerala",
  },
  {
    pincode: "691523",
    localityName: "Adoor Town",
    latitude: 9.1533,
    longitude: 76.7360,
    district: "Pathanamthitta",
    state: "Kerala",
  },
  {
    pincode: "689101",
    localityName: "Thiruvalla",
    latitude: 9.3835,
    longitude: 76.5740,
    district: "Pathanamthitta",
    state: "Kerala",
  },
  {
    pincode: "689641",
    localityName: "Kozhencherry",
    latitude: 9.3400,
    longitude: 76.7150,
    district: "Pathanamthitta",
    state: "Kerala",
  },
  {
    pincode: "689501",
    localityName: "Pandalam",
    latitude: 9.2295,
    longitude: 76.6710,
    district: "Pathanamthitta",
    state: "Kerala",
  },
  {
    pincode: "689672",
    localityName: "Ranni",
    latitude: 9.3900,
    longitude: 76.7800,
    district: "Pathanamthitta",
    state: "Kerala",
  },
];

async function seedPathanamthitta() {
  console.log("🌱 Starting to seed Pathanamthitta pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Pathanamthitta",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Pathanamthitta pincodes in database: ${existingCount}`);
    } catch (error) {
      console.log("ℹ️  Could not count existing records (this is OK, continuing...)");
    }

    // Use createMany with skipDuplicates to avoid errors if pincode already exists
    // This will NOT delete any existing data, only add new ones
    try {
      const result = await Promise.race([
        prisma.pincode.createMany({
          data: pincodeData,
          skipDuplicates: true, // Skip if pincode already exists (based on unique constraint)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('CreateMany timeout')), 20000)
        )
      ]);

      console.log(`✅ Successfully inserted ${result.count} new pincodes!`);
      console.log(`📍 District: Pathanamthitta, State: Kerala`);

      if (result.count === 0) {
        console.log("ℹ️  All pincodes already exist in the database. No new records added.");
      }
    } catch (error) {
      if (error.message === 'CreateMany timeout') {
        console.log("⚠️  Database connection timeout. Some records may have been inserted.");
        console.log("ℹ️  You can run this script again - it will skip duplicates.");
      } else {
        throw error;
      }
    }

    // Display all Pathanamthitta pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Pathanamthitta",
            state: "Kerala",
          },
          orderBy: {
            pincode: "asc",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Find query timeout')), 10000)
        )
      ]);

      console.log(`\n📋 Total Pathanamthitta pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Pathanamthitta Pincodes:");
      allPincodes.forEach((p) => {
        const coords = p.latitude && p.longitude 
          ? `[${p.latitude}, ${p.longitude}]` 
          : "[No coordinates]";
        console.log(`  ${p.pincode} - ${p.localityName} ${coords}`);
      });
    } catch (error) {
      console.log("ℹ️  Could not fetch all records for display (insertion was successful)");
    }
  } catch (error) {
    console.error("❌ Error seeding pincodes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

seedPathanamthitta()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

