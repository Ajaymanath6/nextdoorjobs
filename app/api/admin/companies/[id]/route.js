import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";
import { handleFileUpload } from "../../../../../lib/fileUpload";
import { companyService } from "../../../../../lib/services/company.service";

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

/**
 * PATCH /api/admin/companies/[id]
 * Update a company (websiteUrl, description, logo file, logoPath).
 * Only allows updating companies owned by the admin owner user.
 */
export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUserId = await getAdminOwnerUserId();
  if (!adminUserId) {
    return NextResponse.json(
      { error: "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL." },
      { status: 503 }
    );
  }

  const resolvedParams = await params;
  const companyId = parseInt(resolvedParams.id, 10);
  if (Number.isNaN(companyId)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  const existing = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }
  if (existing.userId !== adminUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const updateData = {};

    const websiteUrl = formData.get("websiteUrl");
    if (websiteUrl != null && websiteUrl !== "") updateData.websiteUrl = websiteUrl.toString().trim();

    const description = formData.get("description");
    if (description !== null && description !== undefined) updateData.description = description.toString().trim() || null;

    const logoFile = formData.get("logo");
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const uploadResult = await handleFileUpload(formData, "logo");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error || "Failed to upload logo" },
          { status: 400 }
        );
      }
      updateData.logoPath = uploadResult.path;
    }

    const logoPathUrl = formData.get("logoPath");
    if (logoPathUrl != null && typeof logoPathUrl === "string" && logoPathUrl.trim()) {
      updateData.logoPath = logoPathUrl.trim();
    }

    if (Object.keys(updateData).length === 0) {
      const company = await companyService.getCompanyById(companyId);
      return NextResponse.json({ success: true, company });
    }

    const updatedCompany = await companyService.updateCompany(companyId, updateData);
    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: "Company updated successfully",
    });
  } catch (e) {
    console.error("Admin PATCH company error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.message && e.message.includes("required") ? 400 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/companies/[id]
 * Delete a company and all its associated jobs (cascade).
 * Only allows deleting companies owned by the admin owner user.
 */
export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUserId = await getAdminOwnerUserId();
  if (!adminUserId) {
    return NextResponse.json(
      { error: "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL." },
      { status: 503 }
    );
  }

  const resolvedParams = await params;
  const companyId = parseInt(resolvedParams.id, 10);
  if (Number.isNaN(companyId)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  const existing = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, userId: true, name: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }
  if (existing.userId !== adminUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await companyService.deleteCompany(companyId);
    return NextResponse.json({
      success: true,
      message: `Company "${existing.name}" and all associated jobs deleted successfully`,
    });
  } catch (e) {
    console.error("Admin DELETE company error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
