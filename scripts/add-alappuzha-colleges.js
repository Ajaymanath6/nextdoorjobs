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

// Helper function to parse coordinates from "9.4715° N, 76.3421° E" format
const parseCoordinates = (coordString) => {
  if (!coordString) return { latitude: null, longitude: null };
  
  // Remove spaces and split by comma
  const parts = coordString.split(',').map(s => s.trim());
  if (parts.length !== 2) return { latitude: null, longitude: null };
  
  // Extract latitude (first part)
  const latMatch = parts[0].match(/([\d.]+)/);
  const lat = latMatch ? parseFloat(latMatch[1]) : null;
  
  // Extract longitude (second part)
  const lonMatch = parts[1].match(/([\d.]+)/);
  const lon = lonMatch ? parseFloat(lonMatch[1]) : null;
  
  return { latitude: lat, longitude: lon };
};

// Alappuzha District colleges
const alappuzhaColleges = [
  {
    name: "S.D. College (Govt. Aided)",
    category: "Arts & Science",
    pincode: "688003",
    locality: "Sanathanapuram",
    district: "Alappuzha",
    coordinates: "9.4715° N, 76.3421° E"
  },
  {
    name: "Government College, Ambalapuzha",
    category: "Arts & Science",
    pincode: "688561",
    locality: "Ambalapuzha",
    district: "Alappuzha",
    coordinates: "9.3825° N, 76.3610° E"
  },
  {
    name: "Govt. Arts & Science College, Thavanur",
    category: "Arts & Science",
    pincode: "679573",
    locality: "Thavanur",
    district: "Alappuzha",
    coordinates: "10.8415° N, 75.9872° E"
  },
  {
    name: "Government Polytechnic College, Cherthala",
    category: "Polytechnic",
    pincode: "688524",
    locality: "X-Ray Junction",
    district: "Alappuzha",
    coordinates: "9.6854° N, 76.3312° E"
  },
  {
    name: "Government Polytechnic College, Haripad",
    category: "Polytechnic",
    pincode: "690514",
    locality: "Nangiarkulangara",
    district: "Alappuzha",
    coordinates: "9.2845° N, 76.4510° E"
  },
  {
    name: "Carmel Polytechnic College (Govt. Aided)",
    category: "Polytechnic",
    pincode: "688004",
    locality: "Punnapra",
    district: "Alappuzha",
    coordinates: "9.4421° N, 76.3455° E"
  },
  {
    name: "College of Engineering, Chengannur (Govt. Aided/IHRD)",
    category: "Engineering",
    pincode: "689121",
    locality: "Chengannur",
    district: "Alappuzha",
    coordinates: "9.3175° N, 76.6110° E"
  },
];

async function main() {
  try {
    console.log("🌱 Starting to add Alappuzha colleges...");
    console.log(`📊 Alappuzha colleges: ${alappuzhaColleges.length}`);

    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const college of alappuzhaColleges) {
      try {
        // Parse coordinates
        const { latitude, longitude } = parseCoordinates(college.coordinates);
        
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
            data: {
              name: college.name,
              category: college.category,
              pincode: String(college.pincode),
              locality: college.locality,
              district: college.district,
              latitude: latitude,
              longitude: longitude,
            }
          });
          insertedCount++;
          console.log(`✅ Inserted: ${college.name} (${college.district})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error inserting ${college.name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Inserted: ${insertedCount} new colleges`);
    console.log(`   ℹ️  Skipped (already exist): ${skippedCount} colleges`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} colleges`);
    }

    // Show final statistics
    const totalColleges = await prisma.college.count();
    const collegesByDistrict = await prisma.college.groupBy({
      by: ['district'],
      _count: {
        district: true,
      },
      where: {
        district: { not: null }
      }
    });

    console.log(`\n📋 Final Statistics:`);
    console.log(`   Total colleges: ${totalColleges}`);
    console.log(`\n📋 Colleges by district:`);
    collegesByDistrict.forEach(d => {
      console.log(`   ${d.district}: ${d._count.district} colleges`);
    });
  } catch (error) {
    console.error("❌ Error adding colleges:", error);
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
