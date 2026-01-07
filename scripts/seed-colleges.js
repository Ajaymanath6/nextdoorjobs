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
    district: "Thrissur",
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
  // Palakkad District
  {
    name: "Govt. Victoria College",
    category: "Arts & Science",
    pincode: "678001",
    locality: "Palakkad Town",
    latitude: 10.7813,
    longitude: 76.6508,
  },
  {
    name: "Govt. College Chittur",
    category: "Arts & Science",
    pincode: "678104",
    locality: "Chittur",
    latitude: 10.6865,
    longitude: 76.7115,
  },
  {
    name: "Sree Neelakanda Govt. Sanskrit College",
    category: "Arts & Science",
    pincode: "679303",
    locality: "Pattambi",
    latitude: 10.8143,
    longitude: 76.2057,
  },
  {
    name: "Govt. Engineering College Sreekrishnapuram",
    category: "Engineering",
    pincode: "679513",
    locality: "Sreekrishnapuram",
    latitude: 10.9224,
    longitude: 76.4447,
  },
  {
    name: "RGM Govt. Arts & Science College",
    category: "Arts & Science",
    pincode: "678581",
    locality: "Attappadi",
    latitude: 11.0450,
    longitude: 76.6780,
  },
  {
    name: "Govt. Arts & Science College, Kozhinjampara",
    category: "Arts & Science",
    pincode: "678554",
    locality: "Nattukal",
    latitude: 10.7225,
    longitude: 76.8450,
  },
  {
    name: "Govt. Arts & Science College, Thrithala",
    category: "Arts & Science",
    pincode: "679534",
    locality: "Thrithala",
    latitude: 10.8066,
    longitude: 76.1360,
  },
  {
    name: "Govt. Arts & Science College, Pathirippala",
    category: "Arts & Science",
    pincode: "678642",
    locality: "Pathirippala",
    latitude: 10.8090,
    longitude: 76.4560,
  },
  {
    name: "Govt. Polytechnic College, Palakkad",
    category: "Polytechnic",
    pincode: "678551",
    locality: "Kodumbu",
    latitude: 10.7490,
    longitude: 76.6850,
  },
  {
    name: "IPT & Govt. Polytechnic College, Shoranur",
    category: "Polytechnic",
    pincode: "679122",
    locality: "Shoranur",
    latitude: 10.7675,
    longitude: 76.2805,
  },
  {
    name: "Chembai Memorial Govt. Music College",
    category: "Fine Arts",
    pincode: "678001",
    locality: "Palakkad Town",
    latitude: 10.7715,
    longitude: 76.6550,
  },
  // Ernakulam District
  {
    name: "Maharaja's College",
    category: "Arts & Science",
    pincode: "682011",
    locality: "Ernakulam South",
    latitude: 9.9723,
    longitude: 76.2811,
  },
  {
    name: "Govt. Model Engineering College (MEC)",
    category: "Engineering",
    pincode: "682021",
    locality: "Thrikkakara",
    latitude: 10.0284,
    longitude: 76.3288,
  },
  {
    name: "Govt. Law College, Ernakulam",
    category: "Law",
    pincode: "682011",
    locality: "Marine Drive",
    latitude: 9.9791,
    longitude: 76.2801,
  },
  {
    name: "Govt. Sanskrit College, Tripunithura",
    category: "Arts & Science",
    pincode: "682301",
    locality: "Tripunithura",
    latitude: 9.9482,
    longitude: 76.3423,
  },
  {
    name: "Govt. Arts & Science College, Elamunnapuzha",
    category: "Arts & Science",
    pincode: "682503",
    locality: "Vypin",
    latitude: 9.9995,
    longitude: 76.2415,
  },
  {
    name: "Govt. College, Manimalakunnu",
    category: "Arts & Science",
    pincode: "686664",
    locality: "Koothattukulam",
    latitude: 9.8824,
    longitude: 76.5492,
  },
  {
    name: "Govt. Polytechnic College, Kalamassery",
    category: "Polytechnic",
    pincode: "683104",
    locality: "Kalamassery",
    latitude: 10.0543,
    longitude: 76.3195,
  },
  {
    name: "Govt. Polytechnic College, Kothamangalam",
    category: "Polytechnic",
    pincode: "686691",
    locality: "Chelad",
    latitude: 10.0754,
    longitude: 76.6432,
  },
  {
    name: "Govt. Polytechnic College, Perumbavoor",
    category: "Polytechnic",
    pincode: "683543",
    locality: "Koovappady",
    latitude: 10.1332,
    longitude: 76.4955,
  },
  {
    name: "RLV College of Music and Fine Arts",
    category: "Fine Arts",
    pincode: "682301",
    locality: "Tripunithura",
    latitude: 9.9515,
    longitude: 76.3392,
  },
  // Idukki District
  {
    name: "Govt. Engineering College, Idukki",
    category: "Engineering",
    pincode: "685603",
    locality: "Painavu",
    latitude: 9.8491,
    longitude: 76.9442,
  },
  {
    name: "Government College, Kattappana",
    category: "Arts & Science",
    pincode: "685508",
    locality: "Kattappana",
    latitude: 9.7303,
    longitude: 77.1213,
  },
  {
    name: "Government College, Munnar",
    category: "Arts & Science",
    pincode: "685612",
    locality: "Munnar",
    latitude: 10.0889,
    longitude: 77.0595,
  },
  {
    name: "Govt. Arts & Science College, Elappara",
    category: "Arts & Science",
    pincode: "685501",
    locality: "Elappara",
    latitude: 9.6415,
    longitude: 77.0125,
  },
  {
    name: "Govt. Arts & Science College, Udumbanchola",
    category: "Arts & Science",
    pincode: "685566",
    locality: "Udumbanchola",
    latitude: 9.8851,
    longitude: 77.1654,
  },
  {
    name: "Govt. Polytechnic College, Muttom",
    category: "Polytechnic",
    pincode: "685587",
    locality: "Muttom",
    latitude: 9.8455,
    longitude: 76.7451,
  },
  {
    name: "Govt. Polytechnic College, Kumily",
    category: "Polytechnic",
    pincode: "685533",
    locality: "Vandiperiyar",
    latitude: 9.5852,
    longitude: 77.0864,
  },
  {
    name: "Govt. Polytechnic College, Nedumkandam",
    category: "Polytechnic",
    pincode: "685553",
    locality: "Nedumkandam",
    latitude: 9.8256,
    longitude: 77.1584,
  },
  {
    name: "Govt. Polytechnic College, Purappuzha",
    category: "Polytechnic",
    pincode: "685583",
    locality: "Purappuzha",
    latitude: 9.8642,
    longitude: 76.6985,
  },
  // Kannur District
  {
    name: "Government Brennen College",
    category: "Arts & Science",
    pincode: "670106",
    locality: "Dharmadam",
    latitude: 11.7766,
    longitude: 75.4633,
  },
  {
    name: "Govt. College of Engineering, Kannur",
    category: "Engineering",
    pincode: "670563",
    locality: "Mangattuparamba",
    latitude: 11.9701,
    longitude: 75.3721,
  },
  {
    name: "Krishna Menon Memorial Govt. Women's College",
    category: "Arts & Science",
    pincode: "670001",
    locality: "Pallikkunnu",
    latitude: 11.8906,
    longitude: 75.3615,
  },
  {
    name: "Government College, Madappally",
    category: "Arts & Science",
    pincode: "673102",
    locality: "Madappally",
    latitude: 11.6425,
    longitude: 75.5410,
  },
  {
    name: "Government College, Peringome",
    category: "Arts & Science",
    pincode: "670353",
    locality: "Peringome",
    latitude: 12.1932,
    longitude: 75.3351,
  },
  {
    name: "Govt. College of Teacher Education",
    category: "Education",
    pincode: "670101",
    locality: "Thalassery",
    latitude: 11.7512,
    longitude: 75.4950,
  },
  {
    name: "Government Polytechnic College, Kannur",
    category: "Polytechnic",
    pincode: "670007",
    locality: "Thottada",
    latitude: 11.8445,
    longitude: 75.4085,
  },
  {
    name: "Govt. Polytechnic College, Mattannur",
    category: "Polytechnic",
    pincode: "670702",
    locality: "Mattannur",
    latitude: 11.9165,
    longitude: 75.5862,
  },
  {
    name: "Govt. Residential Women's Polytechnic",
    category: "Polytechnic",
    pincode: "670307",
    locality: "Payyannur",
    latitude: 12.1023,
    longitude: 75.2014,
  },
  {
    name: "Govt. Polytechnic College, Naduvil",
    category: "Polytechnic",
    pincode: "670582",
    locality: "Naduvil",
    latitude: 12.0652,
    longitude: 75.5423,
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

    // Insert colleges one by one to avoid timeout issues
    // This will NOT delete any existing data, only add new ones
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const college of colleges) {
      try {
        // Check if college already exists
        const existing = await prisma.college.findUnique({
          where: { name: college.name },
          select: { id: true }
        });

        if (existing) {
          skippedCount++;
          console.log(`ℹ️  Already exists: ${college.name}`);
        } else {
          // Insert new college
          await prisma.college.create({
            data: college
          });
          insertedCount++;
          console.log(`✅ Inserted: ${college.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error inserting ${college.name}:`, error.message);
        // Continue with next college
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Inserted: ${insertedCount} new colleges`);
    console.log(`   ℹ️  Skipped (already exist): ${skippedCount} colleges`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} colleges`);
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
