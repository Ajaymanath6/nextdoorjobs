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

const jobTitles = [
  // Technology (20 titles)
  { title: "Software Engineer", category: "Technology" },
  { title: "Frontend Developer", category: "Technology" },
  { title: "Backend Developer", category: "Technology" },
  { title: "Full Stack Developer", category: "Technology" },
  { title: "DevOps Engineer", category: "Technology" },
  { title: "Cloud Engineer", category: "Technology" },
  { title: "Data Scientist", category: "Technology" },
  { title: "Data Analyst", category: "Technology" },
  { title: "Machine Learning Engineer", category: "Technology" },
  { title: "AI Engineer", category: "Technology" },
  { title: "Mobile Developer", category: "Technology" },
  { title: "QA Engineer", category: "Technology" },
  { title: "Database Administrator", category: "Technology" },
  { title: "System Administrator", category: "Technology" },
  { title: "Network Engineer", category: "Technology" },
  { title: "Cybersecurity Analyst", category: "Technology" },
  { title: "IT Support", category: "Technology" },
  { title: "Technical Writer", category: "Technology" },
  { title: "Solutions Architect", category: "Technology" },
  { title: "Web Developer", category: "Technology" },

  // Design (10 titles)
  { title: "Product Designer", category: "Design" },
  { title: "UX Designer", category: "Design" },
  { title: "UI Designer", category: "Design" },
  { title: "Graphic Designer", category: "Design" },
  { title: "Web Designer", category: "Design" },
  { title: "Motion Designer", category: "Design" },
  { title: "3D Designer", category: "Design" },
  { title: "Game Designer", category: "Design" },
  { title: "Interior Designer", category: "Design" },
  { title: "Fashion Designer", category: "Design" },

  // Business (15 titles)
  { title: "Business Analyst", category: "Business" },
  { title: "Product Manager", category: "Business" },
  { title: "Project Manager", category: "Business" },
  { title: "Program Manager", category: "Business" },
  { title: "Marketing Manager", category: "Business" },
  { title: "Sales Manager", category: "Business" },
  { title: "Account Manager", category: "Business" },
  { title: "Operations Manager", category: "Business" },
  { title: "HR Manager", category: "Business" },
  { title: "Recruiter", category: "Business" },
  { title: "Business Development Manager", category: "Business" },
  { title: "Strategy Consultant", category: "Business" },
  { title: "Management Consultant", category: "Business" },
  { title: "Financial Consultant", category: "Business" },
  { title: "Marketing Specialist", category: "Business" },

  // Education (8 titles)
  { title: "Teacher", category: "Education" },
  { title: "Professor", category: "Education" },
  { title: "Tutor", category: "Education" },
  { title: "Lecturer", category: "Education" },
  { title: "Educational Consultant", category: "Education" },
  { title: "Curriculum Developer", category: "Education" },
  { title: "Training Specialist", category: "Education" },
  { title: "Academic Advisor", category: "Education" },

  // Science (8 titles)
  { title: "Chemist", category: "Science" },
  { title: "Biologist", category: "Science" },
  { title: "Physicist", category: "Science" },
  { title: "Research Scientist", category: "Science" },
  { title: "Lab Technician", category: "Science" },
  { title: "Microbiologist", category: "Science" },
  { title: "Biotechnologist", category: "Science" },
  { title: "Environmental Scientist", category: "Science" },

  // Healthcare (10 titles)
  { title: "Nurse", category: "Healthcare" },
  { title: "Doctor", category: "Healthcare" },
  { title: "Pharmacist", category: "Healthcare" },
  { title: "Physiotherapist", category: "Healthcare" },
  { title: "Medical Technician", category: "Healthcare" },
  { title: "Radiologist", category: "Healthcare" },
  { title: "Surgeon", category: "Healthcare" },
  { title: "Dentist", category: "Healthcare" },
  { title: "Veterinarian", category: "Healthcare" },
  { title: "Nutritionist", category: "Healthcare" },

  // Engineering (10 titles)
  { title: "Mechanical Engineer", category: "Engineering" },
  { title: "Civil Engineer", category: "Engineering" },
  { title: "Electrical Engineer", category: "Engineering" },
  { title: "Chemical Engineer", category: "Engineering" },
  { title: "Aerospace Engineer", category: "Engineering" },
  { title: "Automotive Engineer", category: "Engineering" },
  { title: "Industrial Engineer", category: "Engineering" },
  { title: "Manufacturing Engineer", category: "Engineering" },
  { title: "Structural Engineer", category: "Engineering" },
  { title: "Environmental Engineer", category: "Engineering" },

  // Finance (8 titles)
  { title: "Accountant", category: "Finance" },
  { title: "Financial Analyst", category: "Finance" },
  { title: "Investment Banker", category: "Finance" },
  { title: "Auditor", category: "Finance" },
  { title: "Tax Consultant", category: "Finance" },
  { title: "Financial Advisor", category: "Finance" },
  { title: "Risk Analyst", category: "Finance" },
  { title: "Credit Analyst", category: "Finance" },

  // Other (10 titles)
  { title: "Chef", category: "Other" },
  { title: "Architect", category: "Other" },
  { title: "Lawyer", category: "Other" },
  { title: "Journalist", category: "Other" },
  { title: "Content Writer", category: "Other" },
  { title: "Social Media Manager", category: "Other" },
  { title: "Customer Support", category: "Other" },
  { title: "Sales Executive", category: "Other" },
  { title: "Real Estate Agent", category: "Other" },
  { title: "Supply Chain Manager", category: "Other" },
];

async function main() {
  console.log("🌱 Starting job titles seed...");
  console.log(`📊 Total job titles to insert: ${jobTitles.length}`);

  try {
    // Use createMany with skipDuplicates
    const result = await prisma.jobTitle.createMany({
      data: jobTitles,
      skipDuplicates: true,
    });

    console.log(`✅ Successfully seeded ${result.count} job titles`);
    
    // Verify the data
    const count = await prisma.jobTitle.count();
    console.log(`📊 Total job titles in database: ${count}`);
    
    // Show breakdown by category
    const categories = await prisma.jobTitle.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });
    
    console.log("\n📋 Job titles by category:");
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count.category} titles`);
    });
    
  } catch (error) {
    console.error("❌ Error seeding job titles:", error);
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




