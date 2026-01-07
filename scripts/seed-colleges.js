import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const colleges = [
  {
    name: "Government Engineering College (GEC)",
    category: "Engineering",
    pincode: "680009",
    locality: "Ramavarmapuram",
    latitude: 10.5516,
    longitude: 76.2238,
  },
  {
    name: "Sri C. Achutha Menon Government College",
    category: "Arts & Science",
    pincode: "680014",
    locality: "Kuttanellur",
    latitude: 10.4996,
    longitude: 76.2421,
  },
  {
    name: "KKTM Government College, Pullut",
    category: "Arts & Science",
    pincode: "680663",
    locality: "Pullut",
    latitude: 10.2285,
    longitude: 76.2023,
  },
  {
    name: "Panampilly Memorial Govt. College (PMGC)",
    category: "Arts & Science",
    pincode: "680722",
    locality: "Potta",
    latitude: 10.3344,
    longitude: 76.3533,
  },
  {
    name: "Government Arts & Science College, Ollur",
    category: "Arts & Science",
    pincode: "680306",
    locality: "Christopher Nagar",
    latitude: 10.4721,
    longitude: 76.2415,
  },
  {
    name: "Government Arts & Science College, Chelakkara",
    category: "Arts & Science",
    pincode: "680591",
    locality: "Killimangalam",
    latitude: 10.7011,
    longitude: 76.3325,
  },
  {
    name: "Government Law College, Thrissur",
    category: "Law",
    pincode: "680003",
    locality: "Ayyanthole",
    latitude: 10.5284,
    longitude: 76.1953,
  },
  {
    name: "Government College of Fine Arts",
    category: "Fine Arts",
    pincode: "680020",
    locality: "Chembukkav",
    latitude: 10.5312,
    longitude: 76.2215,
  },
  {
    name: "Maharaja's Technological Institute (MTI)",
    category: "Polytechnic",
    pincode: "680020",
    locality: "Chembukkav",
    latitude: 10.5305,
    longitude: 76.2208,
  },
  {
    name: "Sree Rama Government Polytechnic College",
    category: "Polytechnic",
    pincode: "680567",
    locality: "Valapad",
    latitude: 10.4192,
    longitude: 76.1085,
  },
  {
    name: "Govt. Women's Polytechnic College, Thrissur",
    category: "Polytechnic",
    pincode: "680007",
    locality: "Nedupuzha",
    latitude: 10.5106,
    longitude: 76.2162,
  },
  {
    name: "Government Polytechnic College, Koratty",
    category: "Polytechnic",
    pincode: "680308",
    locality: "Koratty",
    latitude: 10.2741,
    longitude: 76.3524,
  },
  {
    name: "Government Polytechnic College, Kunnamkulam",
    category: "Polytechnic",
    pincode: "680523",
    locality: "Kizoor",
    latitude: 10.6625,
    longitude: 76.0745,
  },
  {
    name: "Government Polytechnic College, Chelakkara",
    category: "Polytechnic",
    pincode: "680586",
    locality: "Thonoorkkara",
    latitude: 10.7028,
    longitude: 76.3315,
  },
];

async function main() {
  console.log("🌱 Starting colleges seed...");
  console.log(`📊 Total colleges to insert: ${colleges.length}`);

  try {
    // Check how many already exist (with timeout handling)
    let existingCount = 0;
    try {
      existingCount = await Promise.race([
        prisma.college.count(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);
      console.log(`📊 Existing colleges in database: ${existingCount}`);
    } catch (error) {
      console.log("ℹ️  Could not count existing records (this is OK, continuing...)");
    }

    // Use createMany with skipDuplicates to avoid errors if college already exists
    // This will NOT delete any existing data, only add new ones
    try {
      const result = await Promise.race([
        prisma.college.createMany({
          data: colleges,
          skipDuplicates: true, // Skip if college already exists (based on unique constraint)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('CreateMany timeout')), 20000)
        )
      ]);

        console.log(`✅ Successfully inserted ${result.count} new colleges!`);

      if (result.count === 0) {
        console.log("ℹ️  All colleges already exist in the database. No new records added.");
      }
    } catch (error) {
      if (error.message === 'CreateMany timeout') {
        console.log("⚠️  Database connection timeout. Some records may have been inserted.");
        console.log("ℹ️  You can run this script again - it will skip duplicates.");
      } else {
        throw error;
      }
    }

    // Display all colleges after insertion (with timeout handling)
    try {
      const allColleges = await Promise.race([
        prisma.college.findMany({
          orderBy: {
            name: "asc",
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('FindMany timeout')), 10000)
        )
      ]);

      console.log(`\n📊 Total colleges in database: ${allColleges.length}`);
      
      // Show breakdown by category
      const categories = await Promise.race([
        prisma.college.groupBy({
          by: ['category'],
          _count: {
            category: true,
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('GroupBy timeout')), 10000)
        )
      ]);
      
      console.log("\n📋 Colleges by category:");
      categories.forEach(cat => {
        console.log(`   ${cat.category}: ${cat._count.category} colleges`);
      });
    } catch (error) {
      console.log("ℹ️  Could not display colleges (this is OK, data was inserted)");
    }
    
  } catch (error) {
    console.error("❌ Error seeding colleges:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
