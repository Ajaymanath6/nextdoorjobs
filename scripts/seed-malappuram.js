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
    pincode: "676505",
    localityName: "Malappuram City / H.O",
    latitude: 11.0730,
    longitude: 76.0740,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "673647",
    localityName: "Karipur (Calicut International Airport)",
    latitude: 11.1320,
    longitude: 75.9510,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "676121",
    localityName: "Manjeri Town",
    latitude: 11.1210,
    longitude: 76.1210,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "679322",
    localityName: "Perinthalmanna",
    latitude: 10.9750,
    longitude: 76.2250,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "676101",
    localityName: "Tirur Town",
    latitude: 10.9020,
    longitude: 75.9230,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "679329",
    localityName: "Nilambur",
    latitude: 11.2750,
    longitude: 76.2250,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "676503",
    localityName: "Kottakkal (Ayurveda Center)",
    latitude: 11.0010,
    longitude: 76.0020,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "679577",
    localityName: "Ponnani",
    latitude: 10.7720,
    longitude: 75.9250,
    district: "Malappuram",
    state: "Kerala",
  },
  {
    pincode: "679576",
    localityName: "Edapal",
    latitude: 10.7650,
    longitude: 76.0050,
    district: "Malappuram",
    state: "Kerala",
  },
];

async function seedMalappuram() {
  console.log("🌱 Starting to seed Malappuram pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Malappuram",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Malappuram pincodes in database: ${existingCount}`);
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
      console.log(`📍 District: Malappuram, State: Kerala`);

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

    // Display all Malappuram pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Malappuram",
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

      console.log(`\n📋 Total Malappuram pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Malappuram Pincodes:");
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

seedMalappuram()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

