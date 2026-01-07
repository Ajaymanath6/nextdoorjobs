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

// Helper function to parse coordinates from "11.0742° N, 76.0825° E" format
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

// Thiruvananthapuram District colleges
const thiruvananthapuramColleges = [
  {
    name: "University College, Thiruvananthapuram",
    category: "Arts & Science",
    pincode: "695034",
    locality: "Palayam",
    district: "Thiruvananthapuram",
    coordinates: "8.5005° N, 76.9507° E"
  },
  {
    name: "College of Engineering Trivandrum (CET)",
    category: "Engineering",
    pincode: "695016",
    locality: "Sreekariyam",
    district: "Thiruvananthapuram",
    coordinates: "8.5461° N, 76.9063° E"
  },
  {
    name: "Government College for Women",
    category: "Arts & Science",
    pincode: "695014",
    locality: "Vazhuthacaud",
    district: "Thiruvananthapuram",
    coordinates: "8.4998° N, 76.9582° E"
  },
  {
    name: "Government Law College, Thiruvananthapuram",
    category: "Law",
    pincode: "695033",
    locality: "Barton Hill",
    district: "Thiruvananthapuram",
    coordinates: "8.5106° N, 76.9405° E"
  },
  {
    name: "Government Engineering College, Barton Hill",
    category: "Engineering",
    pincode: "695035",
    locality: "Vanchiyoor",
    district: "Thiruvananthapuram",
    coordinates: "8.5118° N, 76.9401° E"
  },
  {
    name: "Government Sanskrit College",
    category: "Arts & Science",
    pincode: "695034",
    locality: null, // Not provided in data
    district: "Thiruvananthapuram",
    coordinates: null // Not provided in data
  },
];

// Wayanad District colleges
const wayanadColleges = [
  {
    name: "Government Engineering College, Wayanad",
    category: "Engineering",
    pincode: "670644",
    locality: "Thalappuzha",
    district: "Wayanad",
    coordinates: "11.8545° N, 75.9450° E"
  },
  {
    name: "N.M.S.M. Government College",
    category: "Arts & Science",
    pincode: "673122",
    locality: "Puzhamudi, Kalpetta",
    district: "Wayanad",
    coordinates: "11.6052° N, 76.0825° E"
  },
  {
    name: "Government College, Mananthavady",
    category: "Arts & Science",
    pincode: "670645",
    locality: "Nallurnad",
    district: "Wayanad",
    coordinates: "11.7850° N, 76.0234° E"
  },
  {
    name: "College of Agriculture, Ambalavayal (KAU)",
    category: "Agricultural Science",
    pincode: "673593",
    locality: "Ambalavayal",
    district: "Wayanad",
    coordinates: "11.6212° N, 76.2165° E"
  },
  {
    name: "Government Polytechnic College, Meenangadi",
    category: "Polytechnic",
    pincode: "673591",
    locality: "Meenangadi",
    district: "Wayanad",
    coordinates: "11.6625° N, 76.1742° E"
  },
  {
    name: "Government Polytechnic College, Mananthavady",
    category: "Polytechnic",
    pincode: "670645",
    locality: "Dwarka",
    district: "Wayanad",
    coordinates: "11.7912° N, 76.0155° E"
  },
  {
    name: "Government Polytechnic College, Meppadi",
    category: "Polytechnic",
    pincode: "673577",
    locality: "Meppadi",
    district: "Wayanad",
    coordinates: "11.5585° N, 76.1241° E"
  },
];

async function main() {
  try {
    console.log("🌱 Starting to add Thiruvananthapuram and Wayanad colleges...");
    console.log(`📊 Thiruvananthapuram colleges: ${thiruvananthapuramColleges.length}`);
    console.log(`📊 Wayanad colleges: ${wayanadColleges.length}`);

    const allColleges = [...thiruvananthapuramColleges, ...wayanadColleges];
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const college of allColleges) {
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

    // Check for missing coordinates
    const collegesWithoutCoords = await prisma.college.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        name: true,
        district: true
      }
    });

    if (collegesWithoutCoords.length > 0) {
      console.log(`\n⚠️  Colleges without coordinates: ${collegesWithoutCoords.length}`);
      collegesWithoutCoords.forEach(c => {
        console.log(`   - ${c.name} (${c.district})`);
      });
    }
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
