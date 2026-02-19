import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

function getExtension(filename) {
  if (!filename || typeof filename !== "string") return "pdf";
  const parts = filename.split(".");
  if (parts.length < 2) return "pdf";
  const ext = parts.pop().toLowerCase();
  if (["pdf", "doc", "docx"].includes(ext)) return ext;
  return "pdf";
}

/**
 * POST /api/profile/resume/upload
 * Upload resume file (Individual only). Replaces existing file.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    if (user.accountType !== "Individual") {
      return NextResponse.json(
        { success: false, error: "Only Individual accounts can upload a resume" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") || formData.get("resume");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PDF and Word (doc/docx) are allowed" },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    const uploadDir = join(process.cwd(), "public", "uploads", "resumes", String(user.id));
    await mkdir(uploadDir, { recursive: true });

    const filename = `resume.${ext}`;
    const filePath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const publicPath = `/uploads/resumes/${user.id}/${filename}`;

    await prisma.resume.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        resumeFilePath: publicPath,
      },
      update: {
        resumeFilePath: publicPath,
      },
    });

    return NextResponse.json({
      success: true,
      path: publicPath,
      url: publicPath,
    });
  } catch (error) {
    console.error("POST /api/profile/resume/upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload resume",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
