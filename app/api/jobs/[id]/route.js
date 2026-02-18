import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

/**
 * DELETE /api/jobs/[id]
 * Soft delete a job position
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = parseInt(params.id);
    
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

    // Soft delete by setting isActive to false
    const updated = await prisma.jobPosition.update({
      where: { id: jobId },
      data: {
        isActive: false,
        autoDeletedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Job deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete job",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update a job position
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = parseInt(params.id);
    
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

    // Parse request body
    const body = await request.json();
    
    // Build update data object with only provided fields
    const updateData = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.jobDescription !== undefined) updateData.jobDescription = body.jobDescription;
    if (body.remoteType !== undefined) updateData.remoteType = body.remoteType;
    if (body.assistRelocation !== undefined) updateData.assistRelocation = body.assistRelocation;
    if (body.seniorityLevel !== undefined) updateData.seniorityLevel = body.seniorityLevel;
    if (body.yearsRequired !== undefined) updateData.yearsRequired = parseFloat(body.yearsRequired);
    if (body.salaryMin !== undefined) updateData.salaryMin = body.salaryMin;
    if (body.salaryMax !== undefined) updateData.salaryMax = body.salaryMax;
    if (body.teamSize !== undefined) updateData.teamSize = body.teamSize;
    if (body.perks !== undefined) updateData.perks = body.perks;
    if (body.holidays !== undefined) updateData.holidays = body.holidays;

    // Update job
    const updated = await prisma.jobPosition.update({
      where: { id: jobId },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      job: updated,
      message: "Job updated successfully"
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update job",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
