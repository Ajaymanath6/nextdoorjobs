import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
config({ path: ".env.local", override: true });
config({ path: ".env" });

// Initialize Prisma Client
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

// GPS coordinates data from CSV
const coordinatesData = [
  // Thrissur Area
  { pincode: "680001", locality: "Thrissur H.O / Central", latitude: 10.5239, longitude: 76.2123 },
  { pincode: "680002", locality: "Punkunnu", latitude: 10.5361, longitude: 76.2023 },
  { pincode: "680003", locality: "Ayyanthole", latitude: 10.5303, longitude: 76.1912 },
  { pincode: "680004", locality: "Poothole / West Fort", latitude: 10.5208, longitude: 76.2014 },
  { pincode: "680005", locality: "Thrissur East", latitude: 10.5280, longitude: 76.2250 },
  { pincode: "680006", locality: "Kuriachira / Anchery", latitude: 10.5015, longitude: 76.2234 },
  { pincode: "680007", locality: "Kurkancheri / Vadookkara", latitude: 10.5030, longitude: 76.2105 },
  { pincode: "680008", locality: "Cherur / Peringavu", latitude: 10.5476, longitude: 76.2285 },
  { pincode: "680010", locality: "Viyyur / Kolazhi", latitude: 10.5540, longitude: 76.2160 },
  { pincode: "680012", locality: "Pullazhi / Chettupuzha", latitude: 10.5120, longitude: 76.1780 },
  { pincode: "680014", locality: "Puthur / Kuttanellur", latitude: 10.5050, longitude: 76.2730 },
  { pincode: "680020", locality: "Thrissur City", latitude: 10.5215, longitude: 76.2150 },
  { pincode: "680026", locality: "Chiyyaram", latitude: 10.4910, longitude: 76.2150 },
  
  // Irinjalakuda Area
  { pincode: "680121", locality: "Irinjalakuda / Chelur", latitude: 10.3340, longitude: 76.2050 },
  { pincode: "680122", locality: "Edathirinji", latitude: 10.3150, longitude: 76.1940 },
  { pincode: "680123", locality: "Konathukunnu", latitude: 10.2880, longitude: 76.2010 },
  { pincode: "680125", locality: "Porathissery", latitude: 10.3541, longitude: 76.2125 },
  { pincode: "680683", locality: "Kallettumkara / Alur", latitude: 10.3450, longitude: 76.2420 },
  { pincode: "680684", locality: "Kodakara", latitude: 10.3590, longitude: 76.2840 },
  { pincode: "680702", locality: "Kattoor", latitude: 10.3320, longitude: 76.1680 },
  { pincode: "680711", locality: "Karuvannur / Karalam", latitude: 10.3880, longitude: 76.2120 },
];

async function updatePincodeCoordinates() {
  console.log("🌍 Starting to update pincode coordinates...");

  let successCount = 0;
  let failCount = 0;
  const failedPincodes = [];

  try {
    for (const coordData of coordinatesData) {
      try {
        const updated = await prisma.pincode.update({
          where: { pincode: coordData.pincode },
          data: {
            latitude: coordData.latitude,
            longitude: coordData.longitude,
          },
        });

        console.log(`✅ Updated ${coordData.pincode} (${coordData.locality}): ${coordData.latitude}, ${coordData.longitude}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update ${coordData.pincode}:`, error.message);
        failCount++;
        failedPincodes.push(coordData.pincode);
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} pincodes`);
    console.log(`   ❌ Failed: ${failCount} pincodes`);
    
    if (failedPincodes.length > 0) {
      console.log(`   Failed pincodes: ${failedPincodes.join(", ")}`);
    }

    // Verify updates
    const verifiedCount = await prisma.pincode.count({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    console.log(`\n✅ Total pincodes with coordinates in database: ${verifiedCount}`);
  } catch (error) {
    console.error("❌ Error updating pincode coordinates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

updatePincodeCoordinates()
  .then(() => {
    console.log("\n✨ Coordinate update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Coordinate update failed:", error);
    process.exit(1);
  });

