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
    pincode: "673016",
    localityName: "UL Cyberpark / Nellikode",
    latitude: 11.2558,
    longitude: 75.8200,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673014",
    localityName: "Govt. Cyberpark / Palazhi",
    latitude: 11.2395,
    longitude: 75.8340,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673008",
    localityName: "Calicut Medical College",
    latitude: 11.2720,
    longitude: 75.8400,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673001",
    localityName: "Calicut H.O / Railway Station",
    latitude: 11.2587,
    longitude: 75.7804,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673003",
    localityName: "Kallai",
    latitude: 11.2352,
    longitude: 75.7938,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673006",
    localityName: "Eranhipalam",
    latitude: 11.2764,
    longitude: 75.7895,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673631",
    localityName: "Feroke",
    latitude: 11.1820,
    longitude: 75.8450,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673017",
    localityName: "Chevayur",
    latitude: 11.2820,
    longitude: 75.8230,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673015",
    localityName: "Beypore",
    latitude: 11.1650,
    longitude: 75.8150,
    district: "Kozhikode",
    state: "Kerala",
  },
  {
    pincode: "673032",
    localityName: "Calicut Beach / Courts",
    latitude: 11.2570,
    longitude: 75.7720,
    district: "Kozhikode",
    state: "Kerala",
  },
];

async function seedKozhikode() {
  console.log("🌱 Starting to seed Kozhikode (Calicut) pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Kozhikode",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Kozhikode pincodes in database: ${existingCount}`);
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
      console.log(`📍 District: Kozhikode (Calicut), State: Kerala`);

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

    // Display all Kozhikode pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Kozhikode",
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

      console.log(`\n📋 Total Kozhikode pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Kozhikode Pincodes:");
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

seedKozhikode()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

