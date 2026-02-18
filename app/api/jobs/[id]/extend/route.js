import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const jobId = parseInt(resolvedParams.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }
    
    // Verify user owns this job
    const job = await prisma.jobPosition.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.company.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate new expiry date
    const currentExpiry = job.expiresAt || (() => {
      const initial = new Date(job.createdAt);
      initial.setDate(initial.getDate() + 14); // Initial 2 weeks
      return initial;
    })();
    
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + 14); // Add 2 more weeks

    // Update job with new expiry
    const updated = await prisma.jobPosition.update({
      where: { id: jobId },
      data: {
        extensionCount: { increment: 1 },
        expiresAt: newExpiry,
        autoDeletedAt: null, // Reset auto-delete
        isActive: true, // Reactivate if was inactive
      },
    });

    return NextResponse.json({ 
      success: true, 
      job: updated,
      message: "Job extended for 2 more weeks"
    });
  } catch (error) {
    console.error("Error extending job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to extend job",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
