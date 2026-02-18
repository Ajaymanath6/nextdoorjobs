import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "companies");

const EXT_TO_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * GET /api/uploads/companies/[filename]
 * Serves company logo from local storage. Files are stored in public/uploads/companies/
 * and served by the backend so they work consistently (e.g. same origin, no static build dependency).
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams?.filename;
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }
    // Prevent path traversal: only allow a single path segment (no slashes)
    if (filename.includes("/") || filename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType = EXT_TO_MIME[ext] || "application/octet-stream";

    const filePath = join(UPLOAD_DIR, filename);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    if (err?.code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Serve company upload error:", err?.message);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
