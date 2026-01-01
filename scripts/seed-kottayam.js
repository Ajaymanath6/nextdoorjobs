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
    pincode: "686001",
    localityName: "Kottayam H.O / Railway Station",
    latitude: 9.5916,
    longitude: 76.5221,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686008",
    localityName: "Gandhi Nagar (Medical College Area)",
    latitude: 9.6250,
    longitude: 76.5230,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686507",
    localityName: "Kanjirappally",
    latitude: 9.5577,
    longitude: 76.7862,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686101",
    localityName: "Changanassery",
    latitude: 9.4388,
    longitude: 76.5382,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686575",
    localityName: "Pala / Palai Town",
    latitude: 9.7081,
    longitude: 76.6841,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686631",
    localityName: "Ettumanoor",
    latitude: 9.6680,
    longitude: 76.5640,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686141",
    localityName: "Vaikom",
    latitude: 9.7470,
    longitude: 76.3930,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686106",
    localityName: "Changanacherry Industrialnagar",
    latitude: 9.4420,
    longitude: 76.5510,
    district: "Kottayam",
    state: "Kerala",
  },
  {
    pincode: "686002",
    localityName: "Nagampadam",
    latitude: 9.5972,
    longitude: 76.5276,
    district: "Kottayam",
    state: "Kerala",
  },
];

async function seedKottayam() {
  console.log("🌱 Starting to seed Kottayam pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Kottayam",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Kottayam pincodes in database: ${existingCount}`);
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
      console.log(`📍 District: Kottayam, State: Kerala`);

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

    // Display all Kottayam pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Kottayam",
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

      console.log(`\n📋 Total Kottayam pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Kottayam Pincodes:");
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

seedKottayam()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

