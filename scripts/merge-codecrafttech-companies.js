/**
 * Script to merge duplicate codecrafttech companies
 * Keeps the latest company (with most jobs) and reassigns all jobs from duplicates
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 60000 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fetchLogoIfMissing(company) {
  if (company.logoPath || !company.websiteUrl) {
    return company.logoPath;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/onboarding/fetch-logo?url=${encodeURIComponent(company.websiteUrl)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.logoUrl) {
        console.log(`  ✓ Fetched logo for ${company.name}: ${data.logoUrl}`);
        return data.logoUrl;
      }
    }
  } catch (error) {
    console.error(`  ✗ Failed to fetch logo for ${company.name}:`, error.message);
  }
  return null;
}

async function mergeCodecraftCompanies() {
  console.log('🔍 Searching for codecrafttech companies...\n');

  // Find all companies with names containing "codecrafttech" or "code craft" (case-insensitive)
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { contains: 'codecrafttech', mode: 'insensitive' } },
        { name: { contains: 'code craft', mode: 'insensitive' } },
      ],
    },
    include: {
      jobPositions: {
        where: { isActive: true },
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (companies.length === 0) {
    console.log('❌ No codecrafttech companies found.');
    return;
  }

  if (companies.length === 1) {
    console.log(`✓ Only one codecrafttech company found: ${companies[0].name} (ID: ${companies[0].id})`);
    console.log(`  Jobs: ${companies[0].jobPositions.length}`);
    
    // Check if logo is missing and fetch it
    if (!companies[0].logoPath && companies[0].websiteUrl) {
      console.log('\n📥 Logo missing, fetching...');
      const logoPath = await fetchLogoIfMissing(companies[0]);
      if (logoPath) {
        await prisma.company.update({
          where: { id: companies[0].id },
          data: { logoPath },
        });
        console.log('✓ Logo updated successfully');
      }
    } else if (companies[0].logoPath) {
      console.log(`✓ Logo already set: ${companies[0].logoPath}`);
    }
    
    return;
  }

  console.log(`Found ${companies.length} codecrafttech companies:\n`);
  companies.forEach((company, idx) => {
    console.log(`${idx + 1}. ${company.name} (ID: ${company.id})`);
    console.log(`   Created: ${company.createdAt.toISOString()}`);
    console.log(`   Jobs: ${company.jobPositions.length}`);
    console.log(`   Logo: ${company.logoPath || 'NOT SET'}`);
    console.log(`   Website: ${company.websiteUrl || 'NOT SET'}`);
    console.log('');
  });

  // Keep the company with the most jobs (latest if tied)
  const companyToKeep = companies.reduce((best, current) => {
    if (current.jobPositions.length > best.jobPositions.length) {
      return current;
    }
    if (current.jobPositions.length === best.jobPositions.length && current.createdAt > best.createdAt) {
      return current;
    }
    return best;
  }, companies[0]);

  const companiesToMerge = companies.filter(c => c.id !== companyToKeep.id);

  console.log(`\n📌 Keeping: ${companyToKeep.name} (ID: ${companyToKeep.id}) with ${companyToKeep.jobPositions.length} jobs`);
  console.log(`🔄 Merging ${companiesToMerge.length} duplicate(s)...\n`);

  // Reassign all jobs from duplicates to the company we're keeping
  for (const duplicate of companiesToMerge) {
    if (duplicate.jobPositions.length > 0) {
      console.log(`  Reassigning ${duplicate.jobPositions.length} jobs from company ${duplicate.id}...`);
      await prisma.jobPosition.updateMany({
        where: { companyId: duplicate.id },
        data: { companyId: companyToKeep.id },
      });
      console.log(`  ✓ Jobs reassigned`);
    }

    // Delete the duplicate company
    console.log(`  Deleting duplicate company ${duplicate.id}...`);
    await prisma.company.delete({
      where: { id: duplicate.id },
    });
    console.log(`  ✓ Company deleted\n`);
  }

  // Fetch logo if missing
  if (!companyToKeep.logoPath && companyToKeep.websiteUrl) {
    console.log('📥 Fetching logo for kept company...');
    const logoPath = await fetchLogoIfMissing(companyToKeep);
    if (logoPath) {
      await prisma.company.update({
        where: { id: companyToKeep.id },
        data: { logoPath },
      });
      console.log('✓ Logo updated successfully');
    }
  }

  // Get final job count
  const finalJobCount = await prisma.jobPosition.count({
    where: { companyId: companyToKeep.id, isActive: true },
  });

  console.log(`\n✅ Merge complete!`);
  console.log(`   Final company: ${companyToKeep.name} (ID: ${companyToKeep.id})`);
  console.log(`   Total active jobs: ${finalJobCount}`);
  console.log(`   Logo: ${companyToKeep.logoPath || 'NOT SET'}`);
}

async function main() {
  try {
    await mergeCodecraftCompanies();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
