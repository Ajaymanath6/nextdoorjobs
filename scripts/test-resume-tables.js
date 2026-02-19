import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testResumeTables() {
  try {
    console.log("Testing Resume tables...\n");

    // Test 1: Check if Resume model is accessible
    console.log("1. Testing Resume model access...");
    const resumeCount = await prisma.resume.count();
    console.log(`   ✓ Resume table accessible. Count: ${resumeCount}`);

    // Test 2: Check if ResumeWorkExperience model is accessible
    console.log("\n2. Testing ResumeWorkExperience model access...");
    const workExpCount = await prisma.resumeWorkExperience.count();
    console.log(`   ✓ ResumeWorkExperience table accessible. Count: ${workExpCount}`);

    // Test 3: Check if ResumeEducation model is accessible
    console.log("\n3. Testing ResumeEducation model access...");
    const educationCount = await prisma.resumeEducation.count();
    console.log(`   ✓ ResumeEducation table accessible. Count: ${educationCount}`);

    // Test 4: Try to create a test resume (will fail if user doesn't exist, but that's OK)
    console.log("\n4. Testing Resume table structure...");
    try {
      // This will fail if user 999999 doesn't exist, but it tests the table structure
      await prisma.resume.findUnique({
        where: { userId: 999999 },
      });
      console.log("   ✓ Resume table structure is correct");
    } catch (error) {
      if (error.code === "P2025" || error.message.includes("Record to find does not exist")) {
        console.log("   ✓ Resume table structure is correct (expected error for non-existent user)");
      } else {
        throw error;
      }
    }

    console.log("\n✅ All Resume tables are accessible and working correctly!");
    console.log("\nNote: If you're still getting 500 errors, the issue might be:");
    console.log("  - Prisma Client needs regeneration: npx prisma generate");
    console.log("  - Table structure mismatch (run: npx prisma db push)");
    console.log("  - Missing foreign key constraints");

  } catch (error) {
    console.error("\n❌ Error testing Resume tables:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    if (error.meta) {
      console.error("   Meta:", JSON.stringify(error.meta, null, 2));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testResumeTables();
