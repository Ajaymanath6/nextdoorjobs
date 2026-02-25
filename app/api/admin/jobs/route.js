import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/adminAuth";
import { jobService } from "../../../../lib/services/job.service";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const {
      title,
      category,
      yearsRequired,
      salaryMin,
      salaryMax,
      jobDescription,
      remoteType,
      assistRelocation,
      seniorityLevel,
      teamSize,
      perks,
      holidays,
      companyId,
    } = body;

    if (!title || !category || !jobDescription || companyId == null) {
      return NextResponse.json(
        { error: "Title, category, jobDescription, and companyId are required" },
        { status: 400 }
      );
    }

    const jobPosition = await jobService.createJobPosition({
      title: String(title).trim(),
      category,
      yearsRequired: yearsRequired != null ? parseFloat(yearsRequired) : 0,
      salaryMin: salaryMin != null ? parseInt(salaryMin, 10) : null,
      salaryMax: salaryMax != null ? parseInt(salaryMax, 10) : null,
      jobDescription: String(jobDescription).trim(),
      remoteType: remoteType || null,
      assistRelocation: assistRelocation != null ? Boolean(assistRelocation) : false,
      seniorityLevel: seniorityLevel || null,
      teamSize: teamSize || null,
      perks: Array.isArray(perks) ? perks : [],
      holidays: holidays || null,
      companyId: parseInt(companyId, 10),
    });

    return NextResponse.json({
      success: true,
      jobPosition: {
        id: jobPosition.id,
        title: jobPosition.title,
        companyId: jobPosition.companyId,
      },
    });
  } catch (e) {
    console.error("Admin POST job error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.message && (e.message.includes("required") || e.message.includes("not found")) ? 400 : 500 }
    );
  }
}
