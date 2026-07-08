import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";
import {
  buildResumeData,
  RESUME_INCLUDE,
  MAX_WORK,
  MAX_EDUCATION,
  MAX_SKILLS,
  MAX_CERTIFICATIONS,
  MAX_LANGUAGES,
  mapWorkExperience,
  mapEducation,
  mapSkill,
  mapCertification,
  mapLanguage,
} from "../../../../lib/resumeValidation";

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
      include: RESUME_INCLUDE,
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
    const built = buildResumeData(body);
    if (built.error) {
      return NextResponse.json({ success: false, error: built.error }, { status: 400 });
    }

    const workList = Array.isArray(body.workExperiences)
      ? body.workExperiences.slice(0, MAX_WORK).map(mapWorkExperience)
      : [];
    const educationList = Array.isArray(body.educations)
      ? body.educations.slice(0, MAX_EDUCATION).map(mapEducation)
      : [];
    const skillList = Array.isArray(body.skills)
      ? body.skills.slice(0, MAX_SKILLS).map(mapSkill).filter(Boolean)
      : [];
    const certList = Array.isArray(body.certifications)
      ? body.certifications.slice(0, MAX_CERTIFICATIONS).map(mapCertification).filter(Boolean)
      : [];
    const langList = Array.isArray(body.languages)
      ? body.languages.slice(0, MAX_LANGUAGES).map(mapLanguage).filter(Boolean)
      : [];

    const resume = await prisma.resume.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...built.data,
      },
      update: built.data,
    });

    await prisma.resumeWorkExperience.deleteMany({ where: { resumeId: resume.id } });
    await prisma.resumeEducation.deleteMany({ where: { resumeId: resume.id } });
    await prisma.resumeSkill.deleteMany({ where: { resumeId: resume.id } });
    await prisma.resumeCertification.deleteMany({ where: { resumeId: resume.id } });
    await prisma.resumeLanguage.deleteMany({ where: { resumeId: resume.id } });

    if (workList.length > 0) {
      await prisma.resumeWorkExperience.createMany({
        data: workList.map((w) => ({ resumeId: resume.id, ...w })),
      });
    }
    if (educationList.length > 0) {
      await prisma.resumeEducation.createMany({
        data: educationList.map((e) => ({ resumeId: resume.id, ...e })),
      });
    }
    if (skillList.length > 0) {
      await prisma.resumeSkill.createMany({
        data: skillList.map((s) => ({ resumeId: resume.id, ...s })),
      });
    }
    if (certList.length > 0) {
      await prisma.resumeCertification.createMany({
        data: certList.map((c) => ({ resumeId: resume.id, ...c })),
      });
    }
    if (langList.length > 0) {
      await prisma.resumeLanguage.createMany({
        data: langList.map((l) => ({ resumeId: resume.id, ...l })),
      });
    }

    const updated = await prisma.resume.findUnique({
      where: { id: resume.id },
      include: RESUME_INCLUDE,
    });

    return NextResponse.json({ success: true, resume: updated });
  } catch (error) {
    console.error("PATCH /api/profile/resume error:", error);
    const errorResponse = {
      success: false,
      error: "Failed to save resume",
    };
    if (process.env.NODE_ENV === "development") {
      errorResponse.details = error.message;
      errorResponse.code = error.code;
      if (error.meta) errorResponse.meta = error.meta;
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
