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

// District mapping for all existing colleges
const districtUpdates = [
  // Thrissur District
  { name: "Government Engineering College (GEC)", district: "Thrissur" },
  { name: "Sri C. Achutha Menon Government College", district: "Thrissur" },
  { name: "KKTM Government College, Pullut", district: "Thrissur" },
  { name: "Panampilly Memorial Govt. College (PMGC)", district: "Thrissur" },
  { name: "Government Arts & Science College, Ollur", district: "Thrissur" },
  { name: "Government Arts & Science College, Chelakkara", district: "Thrissur" },
  { name: "Government Law College, Thrissur", district: "Thrissur" },
  { name: "Government College of Fine Arts", district: "Thrissur" },
  { name: "Maharaja's Technological Institute (MTI)", district: "Thrissur" },
  { name: "Sree Rama Government Polytechnic College", district: "Thrissur" },
  { name: "Govt. Women's Polytechnic College, Thrissur", district: "Thrissur" },
  { name: "Government Polytechnic College, Koratty", district: "Thrissur" },
  { name: "Government Polytechnic College, Kunnamkulam", district: "Thrissur" },
  { name: "Government Polytechnic College, Chelakkara", district: "Thrissur" },
  
  // Palakkad District
  { name: "Govt. Victoria College", district: "Palakkad" },
  { name: "Govt. College Chittur", district: "Palakkad" },
  { name: "Sree Neelakanda Govt. Sanskrit College", district: "Palakkad" },
  { name: "Govt. Engineering College Sreekrishnapuram", district: "Palakkad" },
  { name: "RGM Govt. Arts & Science College", district: "Palakkad" },
  { name: "Govt. Arts & Science College, Kozhinjampara", district: "Palakkad" },
  { name: "Govt. Arts & Science College, Thrithala", district: "Palakkad" },
  { name: "Govt. Arts & Science College, Pathirippala", district: "Palakkad" },
  { name: "Govt. Polytechnic College, Palakkad", district: "Palakkad" },
  { name: "IPT & Govt. Polytechnic College, Shoranur", district: "Palakkad" },
  { name: "Chembai Memorial Govt. Music College", district: "Palakkad" },
  
  // Ernakulam District
  { name: "Maharaja's College", district: "Ernakulam" },
  { name: "Govt. Model Engineering College (MEC)", district: "Ernakulam" },
  { name: "Govt. Law College, Ernakulam", district: "Ernakulam" },
  { name: "Govt. Sanskrit College, Tripunithura", district: "Ernakulam" },
  { name: "Govt. Arts & Science College, Elamunnapuzha", district: "Ernakulam" },
  { name: "Govt. College, Manimalakunnu", district: "Ernakulam" },
  { name: "Govt. Polytechnic College, Kalamassery", district: "Ernakulam" },
  { name: "Govt. Polytechnic College, Kothamangalam", district: "Ernakulam" },
  { name: "Govt. Polytechnic College, Perumbavoor", district: "Ernakulam" },
  { name: "RLV College of Music and Fine Arts", district: "Ernakulam" },
  
  // Idukki District
  { name: "Govt. Engineering College, Idukki", district: "Idukki" },
  { name: "Government College, Kattappana", district: "Idukki" },
  { name: "Government College, Munnar", district: "Idukki" },
  { name: "Govt. Arts & Science College, Elappara", district: "Idukki" },
  { name: "Govt. Arts & Science College, Udumbanchola", district: "Idukki" },
  { name: "Govt. Polytechnic College, Muttom", district: "Idukki" },
  { name: "Govt. Polytechnic College, Kumily", district: "Idukki" },
  { name: "Govt. Polytechnic College, Nedumkandam", district: "Idukki" },
  { name: "Govt. Polytechnic College, Purappuzha", district: "Idukki" },
  
  // Kannur District
  { name: "Government Brennen College", district: "Kannur" },
  { name: "Govt. College of Engineering, Kannur", district: "Kannur" },
  { name: "Krishna Menon Memorial Govt. Women's College", district: "Kannur" },
  { name: "Government College, Madappally", district: "Kannur" },
  { name: "Government College, Peringome", district: "Kannur" },
  { name: "Govt. College of Teacher Education", district: "Kannur" },
  { name: "Government Polytechnic College, Kannur", district: "Kannur" },
  { name: "Govt. Polytechnic College, Mattannur", district: "Kannur" },
  { name: "Govt. Residential Women's Polytechnic", district: "Kannur" },
  { name: "Govt. Polytechnic College, Naduvil", district: "Kannur" },
];

// New colleges to add
const newColleges = [
  // Kottayam District
  {
    name: "Government College, Kottayam",
    category: "Arts & Science",
    pincode: "686013",
    locality: "Nattakom",
    district: "Kottayam",
    latitude: 9.5583,
    longitude: 76.5204,
  },
  {
    name: "Rajiv Gandhi Institute of Technology (RIT)",
    category: "Engineering",
    pincode: "686501",
    locality: "Pampady",
    district: "Kottayam",
    latitude: 9.5484,
    longitude: 76.6432,
  },
  {
    name: "Government College, Thalayolaparambu",
    category: "Arts & Science",
    pincode: "686605",
    locality: "Thalayolaparambu",
    district: "Kottayam",
    latitude: 9.8415,
    longitude: 76.4521,
  },
  {
    name: "Govt. Arts & Science College, Pathampuzha",
    category: "Arts & Science",
    pincode: "686582",
    locality: "Poonjar",
    district: "Kottayam",
    latitude: 9.6821,
    longitude: 76.8510,
  },
  {
    name: "Government Polytechnic College, Kottayam",
    category: "Polytechnic",
    pincode: "686013",
    locality: "Nattakom",
    district: "Kottayam",
    latitude: 9.5612,
    longitude: 76.5185,
  },
  {
    name: "Government Polytechnic College, Pala",
    category: "Polytechnic",
    pincode: "686575",
    locality: "Pala",
    district: "Kottayam",
    latitude: 9.7123,
    longitude: 76.6854,
  },
  {
    name: "Government Polytechnic College, Kaduthuruthy",
    category: "Polytechnic",
    pincode: "686604",
    locality: "Kaduthuruthy",
    district: "Kottayam",
    latitude: 9.7845,
    longitude: 76.4812,
  },
  {
    name: "Government Polytechnic College, Ponkunnam",
    category: "Polytechnic",
    pincode: "686506",
    locality: "Kanjirappally",
    district: "Kottayam",
    latitude: 9.5654,
    longitude: 76.7785,
  },
  // Kozhikode District
  {
    name: "Government Arts & Science College, Kozhikode",
    category: "Arts & Science",
    pincode: "673018",
    locality: "Meenchanda",
    district: "Kozhikode",
    latitude: 11.2189,
    longitude: 75.8058,
  },
  {
    name: "Government Engineering College, Kozhikode",
    category: "Engineering",
    pincode: "673005",
    locality: "West Hill",
    district: "Kozhikode",
    latitude: 11.2930,
    longitude: 75.7725,
  },
  {
    name: "Government Law College, Kozhikode",
    category: "Law",
    pincode: "673008",
    locality: "Vellimadukunnu",
    district: "Kozhikode",
    latitude: 11.3061,
    longitude: 75.8245,
  },
  {
    name: "Govt. College, Madappally",
    category: "Arts & Science",
    pincode: "673102",
    locality: "Madappally",
    district: "Kozhikode",
    latitude: 11.6425,
    longitude: 75.5410,
  },
  {
    name: "C.K.G. Memorial Government College",
    category: "Arts & Science",
    pincode: "673525",
    locality: "Perambra",
    district: "Kozhikode",
    latitude: 11.5645,
    longitude: 75.7432,
  },
  {
    name: "S.A.R.B.T.M. Government College",
    category: "Arts & Science",
    pincode: "673307",
    locality: "Muchukunnu, Koyilandy",
    district: "Kozhikode",
    latitude: 11.4580,
    longitude: 75.6980,
  },
];

async function main() {
  console.log("🌱 Starting to update colleges with district data and add new colleges...");
  console.log(`📊 Total colleges to update: ${districtUpdates.length}`);
  console.log(`📊 Total new colleges to add: ${newColleges.length}`);

  try {
    // Step 1: Update existing colleges with district
    let updatedCount = 0;
    let notFoundCount = 0;
    let alreadyUpdatedCount = 0;

    for (const update of districtUpdates) {
      try {
        const existingCollege = await prisma.college.findUnique({
          where: { name: update.name },
          select: { id: true, district: true }
        });

        if (existingCollege) {
          if (existingCollege.district === update.district) {
            alreadyUpdatedCount++;
            console.log(`ℹ️  Already updated: ${update.name} → ${update.district}`);
          } else {
            const result = await prisma.college.update({
              where: { id: existingCollege.id },
              data: { district: update.district },
            });
            updatedCount++;
            console.log(`✅ Updated: ${update.name} → ${result.district}`);
          }
        } else {
          notFoundCount++;
          console.log(`⚠️  Not found: ${update.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${update.name}:`, error.message);
      }
    }

    console.log(`\n📊 District Update Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} colleges`);
    console.log(`   ℹ️  Already up-to-date: ${alreadyUpdatedCount} colleges`);
    if (notFoundCount > 0) {
      console.log(`   ⚠️  Not found: ${notFoundCount} colleges`);
    }

    // Step 2: Add new colleges
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const college of newColleges) {
      try {
        const existing = await prisma.college.findUnique({
          where: { name: college.name },
          select: { id: true }
        });

        if (existing) {
          skippedCount++;
          console.log(`ℹ️  Already exists: ${college.name}`);
        } else {
          await prisma.college.create({
            data: college
          });
          insertedCount++;
          console.log(`✅ Inserted: ${college.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error inserting ${college.name}:`, error.message);
      }
    }

    console.log(`\n📊 New Colleges Summary:`);
    console.log(`   ✅ Inserted: ${insertedCount} new colleges`);
    console.log(`   ℹ️  Skipped (already exist): ${skippedCount} colleges`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} colleges`);
    }

    // Step 3: Show final statistics
    const collegesWithDistrict = await prisma.college.count({
      where: {
        district: { not: null },
      },
    });

    const totalColleges = await prisma.college.count();

    console.log(`\n📋 Final Statistics:`);
    console.log(`   Total colleges: ${totalColleges}`);
    console.log(`   Colleges with district: ${collegesWithDistrict}`);

    const districts = await prisma.college.groupBy({
      by: ['district'],
      _count: {
        district: true,
      },
      where: {
        district: { not: null }
      }
    });

    console.log(`\n📋 Colleges by district:`);
    districts.forEach(d => {
      console.log(`   ${d.district}: ${d._count.district} colleges`);
    });

  } catch (error) {
    console.error("❌ Error updating colleges:", error);
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
