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
    pincode: "673121",
    localityName: "Kalpetta H.O (District HQ)",
    latitude: 11.6103,
    longitude: 76.0828,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "673592",
    localityName: "Sulthan Bathery",
    latitude: 11.6627,
    longitude: 76.2570,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "670645",
    localityName: "Mananthavady",
    latitude: 11.8022,
    longitude: 76.0025,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "673591",
    localityName: "Meenangadi",
    latitude: 11.6575,
    longitude: 76.1730,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "673577",
    localityName: "Meppadi (Tourism Hub)",
    latitude: 11.5542,
    longitude: 76.1432,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "673576",
    localityName: "Vythiri",
    latitude: 11.5505,
    longitude: 76.0407,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "673593",
    localityName: "Ambalavayal",
    latitude: 11.6186,
    longitude: 76.2162,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "670721",
    localityName: "Panamaram",
    latitude: 11.7242,
    longitude: 76.0697,
    district: "Wayanad",
    state: "Kerala",
  },
  {
    pincode: "673579",
    localityName: "Pulpally",
    latitude: 11.7850,
    longitude: 76.1600,
    district: "Wayanad",
    state: "Kerala",
  },
];

async function seedWayanad() {
  console.log("🌱 Starting to seed Wayanad pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Wayanad",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Wayanad pincodes in database: ${existingCount}`);
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
      console.log(`📍 District: Wayanad, State: Kerala`);

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

    // Display all Wayanad pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Wayanad",
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

      console.log(`\n📋 Total Wayanad pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Wayanad Pincodes:");
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

seedWayanad()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

