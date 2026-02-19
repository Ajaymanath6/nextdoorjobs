import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

const MAX_WORK = 5;
const MAX_EDUCATION = 5;

/**
 * GET /api/profile/resume
 * Get current user's resume (Individual only). Returns 404 if none.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    if (user.accountType !== "Individual") {
      return NextResponse.json(
        { success: false, error: "Only Individual accounts have a resume" },
        { status: 400 }
      );
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: user.id },
      include: {
        workExperiences: { orderBy: { orderIndex: "asc" } },
        educations: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error("GET /api/profile/resume error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load resume",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/resume
 * Upsert resume for current user (Individual only).
 * Body: resume fields + workExperiences[], educations[]
 */
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    if (user.accountType !== "Individual") {
      return NextResponse.json(
        { success: false, error: "Only Individual accounts can save a resume" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      firstName,
      lastName,
      emailOverride,
      currentPosition,
      yearsExperience,
      expectedSalaryPackage,
      currentSalaryPackage,
      currentSalaryVisibleToRecruiter,
      workExperiences = [],
      educations = [],
    } = body;

    const workList = Array.isArray(workExperiences) ? workExperiences.slice(0, MAX_WORK) : [];
    const educationList = Array.isArray(educations) ? educations.slice(0, MAX_EDUCATION) : [];

    const resumeData = {
      firstName: typeof firstName === "string" ? firstName.trim().slice(0, 255) || null : null,
      lastName: typeof lastName === "string" ? lastName.trim().slice(0, 255) || null : null,
      emailOverride: typeof emailOverride === "string" ? emailOverride.trim().slice(0, 255) || null : null,
      currentPosition: typeof currentPosition === "string" ? currentPosition.trim().slice(0, 255) || null : null,
      yearsExperience: typeof yearsExperience === "string" ? yearsExperience.trim().slice(0, 50) || null : null,
      expectedSalaryPackage: typeof expectedSalaryPackage === "string" ? expectedSalaryPackage.trim().slice(0, 100) || null : null,
      currentSalaryPackage: typeof currentSalaryPackage === "string" ? currentSalaryPackage.trim().slice(0, 100) || null : null,
      currentSalaryVisibleToRecruiter:
        typeof currentSalaryVisibleToRecruiter === "boolean" ? currentSalaryVisibleToRecruiter : false,
    };

    const resume = await prisma.resume.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...resumeData,
      },
      update: resumeData,
    });

    await prisma.resumeWorkExperience.deleteMany({ where: { resumeId: resume.id } });
    await prisma.resumeEducation.deleteMany({ where: { resumeId: resume.id } });

    if (workList.length > 0) {
      await prisma.resumeWorkExperience.createMany({
        data: workList.map((w, i) => ({
          resumeId: resume.id,
          companyName: typeof w.companyName === "string" ? w.companyName.trim().slice(0, 255) || null : null,
          companyUrl: typeof w.companyUrl === "string" ? w.companyUrl.trim().slice(0, 500) || null : null,
          position: typeof w.position === "string" ? w.position.trim().slice(0, 255) || null : null,
          duties: typeof w.duties === "string" ? w.duties.trim().slice(0, 5000) || null : null,
          year: typeof w.year === "string" ? w.year.trim().slice(0, 20) || null : null,
          orderIndex: i,
        })),
      });
    }

    if (educationList.length > 0) {
      await prisma.resumeEducation.createMany({
        data: educationList.map((e, i) => ({
          resumeId: resume.id,
          universityName: typeof e.universityName === "string" ? e.universityName.trim().slice(0, 255) || null : null,
          streamName: typeof e.streamName === "string" ? e.streamName.trim().slice(0, 255) || null : null,
          marksOrScore: typeof e.marksOrScore === "string" ? e.marksOrScore.trim().slice(0, 100) || null : null,
          yearOfPassing: typeof e.yearOfPassing === "string" ? e.yearOfPassing.trim().slice(0, 20) || null : null,
          orderIndex: i,
        })),
      });
    }

    const updated = await prisma.resume.findUnique({
      where: { id: resume.id },
      include: {
        workExperiences: { orderBy: { orderIndex: "asc" } },
        educations: { orderBy: { orderIndex: "asc" } },
      },
    });

    return NextResponse.json({ success: true, resume: updated });
  } catch (error) {
    console.error("PATCH /api/profile/resume error:", error);
    console.error("PATCH /api/profile/resume error stack:", error.stack);
    console.error("PATCH /api/profile/resume error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    // Return detailed error in development, generic in production
    const errorResponse = {
      success: false,
      error: "Failed to save resume",
    };
    
    if (process.env.NODE_ENV === "development") {
      errorResponse.details = error.message;
      errorResponse.code = error.code;
      if (error.meta) {
        errorResponse.meta = error.meta;
      }
      // Include stack trace only in development
      if (error.stack) {
        errorResponse.stack = error.stack;
      }
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
