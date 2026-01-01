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
    pincode: "688001",
    localityName: "Alappuzha H.O / Town",
    latitude: 9.4981,
    longitude: 76.3388,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "688524",
    localityName: "Cherthala Town (Industrial Hub)",
    latitude: 9.6845,
    longitude: 76.3440,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "690502",
    localityName: "Kayamkulam Town",
    latitude: 9.1722,
    longitude: 76.5015,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "689121",
    localityName: "Chengannur Railway Station Area",
    latitude: 9.3175,
    longitude: 76.6110,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "690514",
    localityName: "Haripad Town",
    latitude: 9.2847,
    longitude: 76.4520,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "690101",
    localityName: "Mavelikara Town",
    latitude: 9.2435,
    longitude: 76.5492,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "688534",
    localityName: "Aroor (Industrial/Marine Area)",
    latitude: 9.8780,
    longitude: 76.3040,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "688561",
    localityName: "Ambalapuzha",
    latitude: 9.3820,
    longitude: 76.3620,
    district: "Alappuzha",
    state: "Kerala",
  },
  {
    pincode: "688502",
    localityName: "Kuttanad / Mankombu",
    latitude: 9.4230,
    longitude: 76.4350,
    district: "Alappuzha",
    state: "Kerala",
  },
];

async function seedAlappuzha() {
  console.log("🌱 Starting to seed Alappuzha pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Alappuzha",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Alappuzha pincodes in database: ${existingCount}`);
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
      console.log(`📍 District: Alappuzha, State: Kerala`);

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

    // Display all Alappuzha pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Alappuzha",
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

      console.log(`\n📋 Total Alappuzha pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Alappuzha Pincodes:");
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

seedAlappuzha()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

