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
    pincode: "682042",
    localityName: "Infopark Kochi / SmartCity",
    latitude: 10.0100,
    longitude: 76.3630,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682030",
    localityName: "Kakkanad (District HQ)",
    latitude: 10.0150,
    longitude: 76.3450,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682037",
    localityName: "CSEZ (Special Economic Zone)",
    latitude: 10.0010,
    longitude: 76.3480,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "683104",
    localityName: "Kalamassery (Kinfra / Startup Village)",
    latitude: 10.0550,
    longitude: 76.3210,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682011",
    localityName: "Ernakulam Central (MG Road)",
    latitude: 9.9811,
    longitude: 76.2810,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682016",
    localityName: "Ravipuram / Valanjambalam",
    latitude: 9.9630,
    longitude: 76.2860,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682020",
    localityName: "Kadavanthra",
    latitude: 9.9680,
    longitude: 76.2990,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682019",
    localityName: "Vyttila (Mobility Hub)",
    latitude: 9.9670,
    longitude: 76.3200,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682025",
    localityName: "Palarivattom",
    latitude: 10.0050,
    longitude: 76.3120,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682024",
    localityName: "Edappally (Lulu Mall area)",
    latitude: 10.0250,
    longitude: 76.3080,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682001",
    localityName: "Fort Kochi",
    latitude: 9.9650,
    longitude: 76.2420,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "682003",
    localityName: "Willingdon Island (Port)",
    latitude: 9.9450,
    longitude: 76.2650,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "683101",
    localityName: "Aluva Town",
    latitude: 10.1080,
    longitude: 76.3530,
    district: "Ernakulam",
    state: "Kerala",
  },
  {
    pincode: "683111",
    localityName: "Kochi Airport (CIAL)",
    latitude: 10.1550,
    longitude: 76.3910,
    district: "Ernakulam",
    state: "Kerala",
  },
];

async function seedErnakulam() {
  console.log("🌱 Starting to seed Ernakulam pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Ernakulam",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Ernakulam pincodes in database: ${existingCount}`);
    } catch (error) {
      console.log("ℹ️  Could not count existing records (this is OK, continuing...)");
    }

    // Use createMany with skipDuplicates to avoid errors if pincode already exists
    // This will NOT delete any existing data, only add new ones
    const result = await prisma.pincode.createMany({
      data: pincodeData,
      skipDuplicates: true, // Skip if pincode already exists (based on unique constraint)
    });

    console.log(`✅ Successfully inserted ${result.count} new pincodes!`);
    console.log(`📍 District: Ernakulam, State: Kerala`);

    if (result.count === 0) {
      console.log("ℹ️  All pincodes already exist in the database. No new records added.");
    }

    // Display all Ernakulam pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Ernakulam",
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

      console.log(`\n📋 Total Ernakulam pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Ernakulam Pincodes:");
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

seedErnakulam()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

