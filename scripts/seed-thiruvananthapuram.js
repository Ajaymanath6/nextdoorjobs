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

const pincodeData = [
  {
    pincode: "695001",
    localityName: "Thiruvananthapuram G.P.O (Central)",
    latitude: 8.4900,
    longitude: 76.9500,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695002",
    localityName: "Karamana / Killippalam",
    latitude: 8.4815,
    longitude: 76.9632,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695003",
    localityName: "Kaudiar / Vellayambalam",
    latitude: 8.5190,
    longitude: 76.9630,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695004",
    localityName: "Pattom / MG College",
    latitude: 8.5241,
    longitude: 76.9452,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695005",
    localityName: "Peroorkada / Ambalamukku",
    latitude: 8.5375,
    longitude: 76.9734,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695011",
    localityName: "Medical College / Chalakkuzhi",
    latitude: 8.5225,
    longitude: 76.9270,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695014",
    localityName: "Thycaud / Vazhuthacaud",
    latitude: 8.4980,
    longitude: 76.9580,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695033",
    localityName: "Public Office / PMG Junction",
    latitude: 8.5080,
    longitude: 76.9480,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695581",
    localityName: "Karyavattom (Technopark Phase I & II)",
    latitude: 8.5470,
    longitude: 76.8820,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695582",
    localityName: "Kazhakkoottam (IT Hub Center)",
    latitude: 8.5670,
    longitude: 76.8720,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695583",
    localityName: "Kulathoor (Technopark Surroundings)",
    latitude: 8.5390,
    longitude: 76.8790,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695301",
    localityName: "Kaniyapuram / Pallippuram",
    latitude: 8.5950,
    longitude: 76.8550,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695101",
    localityName: "Attingal (Major North Hub)",
    latitude: 8.6941,
    longitude: 76.8143,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695501",
    localityName: "Balaramapuram",
    latitude: 8.4280,
    longitude: 77.0450,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695121",
    localityName: "Neyyattinkara",
    latitude: 8.4030,
    longitude: 77.0850,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695527",
    localityName: "Vizhinjam (International Port Area)",
    latitude: 8.3780,
    longitude: 76.9930,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "695522",
    localityName: "Poonkulam / Vellayani",
    latitude: 8.4410,
    longitude: 76.9920,
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
];

async function seedThiruvananthapuram() {
  console.log("🌱 Starting to seed Thiruvananthapuram pincodes...");

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.pincode.count({
          where: {
            district: "Thiruvananthapuram",
            state: "Kerala",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing Thiruvananthapuram pincodes in database: ${existingCount}`);
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
    console.log(`📍 District: Thiruvananthapuram, State: Kerala`);

    if (result.count === 0) {
      console.log("ℹ️  All pincodes already exist in the database. No new records added.");
    }

    // Display all Thiruvananthapuram pincodes after insertion (with timeout handling)
    try {
      const allPincodes = await Promise.race([
        prisma.pincode.findMany({
          where: {
            district: "Thiruvananthapuram",
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

      console.log(`\n📋 Total Thiruvananthapuram pincodes in database: ${allPincodes.length}`);
      console.log("\n📋 All Thiruvananthapuram Pincodes:");
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

seedThiruvananthapuram()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

