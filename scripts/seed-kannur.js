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
    pincode: "670001",
    localityName: "Kannur City / H.O",
    latitude: 11.8745,
    longitude: 75.3704,
    district: "Kannur",
    state: "Kerala",
  },
  {
    pincode: "670012",
    localityName: "Thana",
    latitude: 11.8834,
    longitude: 75.3752,
    district: "Kannur",
    state: "Kerala",
  },
  {
    pincode: "670013",
    localityName: "Burnacherry",
    latitude: 11.8650,
    longitude: 75.3600,
    district: "Kannur",
    state: "Kerala",
  },
  {
    pincode: "670702",
    localityName: "Mattannur (Kannur Airport)",
    latitude: 11.9160,
    longitude: 75.5780,
    district: "Kannur",
    state: "Kerala",
  },
  {
    pincode: "670101",
    localityName: "Thalassery Town",
    latitude: 11.7490,
    longitude: 75.4890,
    district: "Kannur",
    state: "Kerala",
  },
  {
    pincode: "670307",
    localityName: "Payyannur",
    latitude: 12.1022,
    longitude: 75.2028,
    district: "Kannur",
    state: "Kerala",
  },
  {
    pincode: "670141",
    localityName: "Taliparamba",
    latitude: 12.0405,
    longitude: 75.3582,
    district: "Kannur",
    state: "Kerala",
  },
  {
    pincode: "670703",
    localityName: "Iritty",
    latitude: 11.9790,
    longitude: 75.6640,
    district: "Kannur",
    state: "Kerala",
  },
];

async function seedKannur() {
  console.log("🌱 Starting to seed Kannur pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Kannur",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Kannur pincodes in database: ${existingCount}`);
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
      console.log(`📍 District: Kannur, State: Kerala`);

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

    // Display all Kannur pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Kannur",
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

      console.log(`\n📋 Total Kannur pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Kannur Pincodes:");
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

seedKannur()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

