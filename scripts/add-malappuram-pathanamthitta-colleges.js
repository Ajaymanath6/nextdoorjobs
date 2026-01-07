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

// Malappuram District colleges
const malappuramColleges = [
  {
    name: "Government College, Malappuram",
    category: "Arts & Science",
    pincode: "676509",
    locality: "Munduparamba",
    district: "Malappuram",
    coordinates: "11.0742° N, 76.0825° E"
  },
  {
    name: "P.T.M. Government College",
    category: "Arts & Science",
    pincode: "679322",
    locality: "Perinthalmanna",
    district: "Malappuram",
    coordinates: "10.9745° N, 76.2231° E"
  },
  {
    name: "Thunchan Memorial Government College",
    category: "Arts & Science",
    pincode: "676502",
    locality: "Tirur",
    district: "Malappuram",
    coordinates: "10.8964° N, 75.8972° E"
  },
  {
    name: "Government Arts & Science College, Kondotty",
    category: "Arts & Science",
    pincode: "673641",
    locality: "Kuzhimanna",
    district: "Malappuram",
    coordinates: "11.1625° N, 75.9610° E"
  },
  {
    name: "Government College for Women, Malappuram",
    category: "Arts & Science",
    pincode: "676519",
    locality: "Down Hill",
    district: "Malappuram",
    coordinates: "11.0612° N, 76.0715° E"
  },
  {
    name: "Government Arts & Science College, Tanur",
    category: "Arts & Science",
    pincode: "676302",
    locality: "Tanur",
    district: "Malappuram",
    coordinates: "10.9750° N, 75.8655° E"
  },
  {
    name: "Government College, Mankada",
    category: "Arts & Science",
    pincode: "679338",
    locality: "Kolathur",
    district: "Malappuram",
    coordinates: "10.9542° N, 76.1523° E"
  },
  {
    name: "Government Polytechnic College, Perinthalmanna",
    category: "Polytechnic",
    pincode: "679322",
    locality: "Angadipuram",
    district: "Malappuram",
    coordinates: "10.9855° N, 76.2084° E"
  },
  {
    name: "Government Polytechnic College, Manjeri",
    category: "Polytechnic",
    pincode: "676122",
    locality: "Manjeri",
    district: "Malappuram",
    coordinates: "11.1215° N, 76.1201° E"
  },
  {
    name: "Government Polytechnic College, Tirurangadi",
    category: "Polytechnic",
    pincode: "676306",
    locality: "Chelari",
    district: "Malappuram",
    coordinates: "11.0621° N, 75.8925° E"
  },
];

// Pathanamthitta District colleges
const pathanamthittaColleges = [
  {
    name: "Government College, Elanthoor",
    category: "Arts & Science",
    pincode: "689643",
    locality: "Elanthoor",
    district: "Pathanamthitta",
    coordinates: "9.2934° N, 76.7185° E"
  },
  {
    name: "Govt. Arts & Science College, Konni",
    category: "Arts & Science",
    pincode: "689691",
    locality: "Konni",
    district: "Pathanamthitta",
    coordinates: "9.2325° N, 76.8450° E"
  },
  {
    name: "Government Polytechnic College, Vennikulam",
    category: "Polytechnic",
    pincode: "689544",
    locality: "Vennikulam",
    district: "Pathanamthitta",
    coordinates: "9.4312° N, 76.6854° E"
  },
  {
    name: "Government Polytechnic College, Adoor",
    category: "Polytechnic",
    pincode: "691523",
    locality: "Manakala",
    district: "Pathanamthitta",
    coordinates: "9.1415° N, 76.7121° E"
  },
  {
    name: "Government Polytechnic College, Vechoochira",
    category: "Polytechnic",
    pincode: "686511",
    locality: "Vechoochira",
    district: "Pathanamthitta",
    coordinates: "9.4125° N, 76.8542° E"
  },
  {
    name: "College of Engineering, Adoor (Govt. Aided/IHRD)",
    category: "Engineering",
    pincode: "691551",
    locality: "Manakala",
    district: "Pathanamthitta",
    coordinates: null // Missing from user data
  },
];

async function main() {
  try {
    console.log("🌱 Starting to add Malappuram and Pathanamthitta colleges...");
    console.log(`📊 Malappuram colleges: ${malappuramColleges.length}`);
    console.log(`📊 Pathanamthitta colleges: ${pathanamthittaColleges.length}`);

    const allColleges = [...malappuramColleges, ...pathanamthittaColleges];
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
