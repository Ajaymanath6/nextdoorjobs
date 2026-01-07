import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Simple in-memory cache for colleges
let collegesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    // Check if cache is valid
    if (collegesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log("✅ Using cached colleges");
      
      // If query is provided, filter the cached results
      if (query && query.trim()) {
        const normalizedQuery = query.toLowerCase().trim();
        const filtered = collegesCache.filter(college => 
          college.name.toLowerCase().includes(normalizedQuery) ||
          college.category.toLowerCase().includes(normalizedQuery)
        );
        return NextResponse.json(filtered);
      }
      
      return NextResponse.json(collegesCache);
    }

    // Fetch from database
    console.log("🔍 Fetching colleges from database...");
    const colleges = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        pincode: true,
        locality: true,
        district: true,
        latitude: true,
        longitude: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Update cache
    collegesCache = colleges;
    cacheTimestamp = Date.now();

    console.log(`✅ Loaded ${colleges.length} colleges`);

    // If query is provided, filter the results
    if (query && query.trim()) {
      const normalizedQuery = query.toLowerCase().trim();
      const filtered = colleges.filter(college => 
        college.name.toLowerCase().includes(normalizedQuery) ||
        college.category.toLowerCase().includes(normalizedQuery)
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(colleges);
  } catch (error) {
    console.error("❌ Error fetching colleges:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
