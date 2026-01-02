import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Simple in-memory cache for job titles
let jobTitlesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    // Check if cache is valid
    if (jobTitlesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log("✅ Using cached job titles");
      
      // If query is provided, filter the cached results
      if (query && query.trim()) {
        const normalizedQuery = query.toLowerCase().trim();
        const filtered = jobTitlesCache.filter(job => 
          job.title.toLowerCase().includes(normalizedQuery)
        );
        return NextResponse.json(filtered);
      }
      
      return NextResponse.json(jobTitlesCache);
    }

    // Fetch from database
    console.log("🔍 Fetching job titles from database...");
    const jobTitles = await prisma.jobTitle.findMany({
      select: {
        id: true,
        title: true,
        category: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    // Update cache
    jobTitlesCache = jobTitles;
    cacheTimestamp = Date.now();

    console.log(`✅ Loaded ${jobTitles.length} job titles`);

    // If query is provided, filter the results
    if (query && query.trim()) {
      const normalizedQuery = query.toLowerCase().trim();
      const filtered = jobTitles.filter(job => 
        job.title.toLowerCase().includes(normalizedQuery)
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(jobTitles);
  } catch (error) {
    console.error("❌ Error fetching job titles:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}



