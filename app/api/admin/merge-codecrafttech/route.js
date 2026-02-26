import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";

async function getAdminOwnerUserId() {
  const idFromEnv = process.env.ADMIN_OWNER_USER_ID;
  if (idFromEnv) {
    const id = parseInt(String(idFromEnv).trim(), 10);
    if (!Number.isNaN(id) && id > 0) return id;
  }
  const email = process.env.ADMIN_OWNER_EMAIL;
  if (email && String(email).trim()) {
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true },
    });
    if (user) return user.id;
  }
  return null;
}

async function fetchLogoIfMissing(company) {
  if (company.logoPath || !company.websiteUrl) {
    return company.logoPath;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/onboarding/fetch-logo?url=${encodeURIComponent(company.websiteUrl)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.logoUrl) {
        return data.logoUrl;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch logo for ${company.name}:`, error.message);
  }
  return null;
}

/**
 * POST /api/admin/merge-codecrafttech
 * Merge duplicate codecrafttech companies
 */
export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = await getAdminOwnerUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Admin owner not configured" },
      { status: 503 }
    );
  }

  try {
    const log = [];
    log.push('🔍 Searching for codecrafttech companies...');

    // Find all companies with names containing "codecrafttech" or "code craft"
    const companies = await prisma.company.findMany({
      where: {
        userId,
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
      log.push('❌ No codecrafttech companies found.');
      return NextResponse.json({ success: false, message: 'No companies found', log });
    }

    if (companies.length === 1) {
      const company = companies[0];
      log.push(`✓ Only one codecrafttech company found: ${company.name} (ID: ${company.id})`);
      log.push(`  Jobs: ${company.jobPositions.length}`);
      
      // Check if logo is missing and fetch it
      if (!company.logoPath && company.websiteUrl) {
        log.push('📥 Logo missing, fetching...');
        const logoPath = await fetchLogoIfMissing(company);
        if (logoPath) {
          await prisma.company.update({
            where: { id: company.id },
            data: { logoPath },
          });
          log.push(`✓ Logo updated: ${logoPath}`);
        } else {
          log.push('⚠ Could not fetch logo');
        }
      } else if (company.logoPath) {
        log.push(`✓ Logo already set: ${company.logoPath}`);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Only one company found, logo checked',
        company: { id: company.id, name: company.name, logoPath: company.logoPath },
        log 
      });
    }

    log.push(`Found ${companies.length} codecrafttech companies:`);
    companies.forEach((company, idx) => {
      log.push(`${idx + 1}. ${company.name} (ID: ${company.id})`);
      log.push(`   Jobs: ${company.jobPositions.length}`);
      log.push(`   Logo: ${company.logoPath || 'NOT SET'}`);
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

    log.push(`📌 Keeping: ${companyToKeep.name} (ID: ${companyToKeep.id}) with ${companyToKeep.jobPositions.length} jobs`);
    log.push(`🔄 Merging ${companiesToMerge.length} duplicate(s)...`);

    // Reassign all jobs from duplicates to the company we're keeping
    for (const duplicate of companiesToMerge) {
      if (duplicate.jobPositions.length > 0) {
        log.push(`  Reassigning ${duplicate.jobPositions.length} jobs from company ${duplicate.id}...`);
        await prisma.jobPosition.updateMany({
          where: { companyId: duplicate.id },
          data: { companyId: companyToKeep.id },
        });
        log.push(`  ✓ Jobs reassigned`);
      }

      log.push(`  Deleting duplicate company ${duplicate.id}...`);
      await prisma.company.delete({
        where: { id: duplicate.id },
      });
      log.push(`  ✓ Company deleted`);
    }

    // Fetch logo if missing
    if (!companyToKeep.logoPath && companyToKeep.websiteUrl) {
      log.push('📥 Fetching logo for kept company...');
      const logoPath = await fetchLogoIfMissing(companyToKeep);
      if (logoPath) {
        await prisma.company.update({
          where: { id: companyToKeep.id },
          data: { logoPath },
        });
        log.push(`✓ Logo updated: ${logoPath}`);
      } else {
        log.push('⚠ Could not fetch logo');
      }
    }

    // Get final job count
    const finalJobCount = await prisma.jobPosition.count({
      where: { companyId: companyToKeep.id, isActive: true },
    });

    const updatedCompany = await prisma.company.findUnique({
      where: { id: companyToKeep.id },
    });

    log.push('✅ Merge complete!');
    log.push(`   Final company: ${updatedCompany.name} (ID: ${updatedCompany.id})`);
    log.push(`   Total active jobs: ${finalJobCount}`);
    log.push(`   Logo: ${updatedCompany.logoPath || 'NOT SET'}`);

    return NextResponse.json({
      success: true,
      message: 'Companies merged successfully',
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        logoPath: updatedCompany.logoPath,
        jobCount: finalJobCount,
      },
      log,
    });
  } catch (error) {
    console.error('Error merging codecrafttech companies:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
