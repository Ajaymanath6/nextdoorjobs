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
  { pincode: "680001", localityName: "Thrissur H.O / Central / Town" },
  { pincode: "680002", localityName: "Punkunnu" },
  { pincode: "680003", localityName: "Ayyanthole / Ayyanthole North" },
  { pincode: "680004", localityName: "Poothole / West Fort" },
  { pincode: "680005", localityName: "Thrissur East / Nellikunnu" },
  { pincode: "680006", localityName: "Kuriachira / Anchery / Nehrunagar" },
  { pincode: "680007", localityName: "Kurkancheri / Nedupuzha / Vadookkara" },
  { pincode: "680008", localityName: "Cherur / Peringavu" },
  { pincode: "680010", localityName: "Viyyur / Kolazhi" },
  { pincode: "680012", localityName: "Pullazhi / Chettupuzha / Manakkodi" },
  { pincode: "680014", localityName: "Puthur / Kuttanellur / Mannamangalam" },
  { pincode: "680020", localityName: "Thrissur City" },
  { pincode: "680026", localityName: "Chiyyaram" },
  { pincode: "680121", localityName: "Irinjalakuda / Chelur" },
  { pincode: "680122", localityName: "Edathirinji" },
  { pincode: "680123", localityName: "Konathukunnu / Karumathra" },
  { pincode: "680125", localityName: "Irinjalakuda North / Porathissery" },
  { pincode: "680683", localityName: "Kallettumkara / Alur / Avittathur" },
  { pincode: "680684", localityName: "Kodakara / Chembuchira" },
  { pincode: "680702", localityName: "Kattoor / Karanchira" },
  { pincode: "680711", localityName: "Karuvannur / Karalam" },
];

const district = "Thrissur";
const state = "Kerala";

async function seedPincodes() {
  console.log("🌱 Starting to seed pincodes...");

  try {
    // Use createMany with skipDuplicates to avoid errors if pincode already exists
    const result = await prisma.pincode.createMany({
      data: pincodeData.map((item) => ({
        pincode: item.pincode,
        localityName: item.localityName,
        district: district,
        state: state,
      })),
      skipDuplicates: true, // Skip if pincode already exists
    });

    console.log(`✅ Successfully inserted ${result.count} pincodes!`);
    console.log(`📍 District: ${district}, State: ${state}`);

    // Display inserted pincodes
    const insertedPincodes = await prisma.pincode.findMany({
      where: {
        district: district,
        state: state,
      },
      orderBy: {
        pincode: "asc",
      },
    });

    console.log("\n📋 Inserted Pincodes:");
    insertedPincodes.forEach((p) => {
      console.log(`  ${p.pincode} - ${p.localityName}`);
    });
  } catch (error) {
    console.error("❌ Error seeding pincodes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPincodes()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
