import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Simple in-memory cache for localities
let localitiesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    // Check if cache is valid
    if (localitiesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log("✅ Returning cached localities");
      return NextResponse.json(localitiesCache);
    }

    console.log("🔍 Fetching localities from database...");

    // Fetch all localities from database
    const localities = await prisma.pincode.findMany({
      where: {
        state: "Kerala",
      },
      select: {
        pincode: true,
        localityName: true,
        district: true,
        state: true,
        latitude: true,
        longitude: true,
      },
      orderBy: [
        { district: "asc" },
        { localityName: "asc" },
      ],
    });

    console.log(`✅ Fetched ${localities.length} localities`);

    // Update cache
    localitiesCache = localities;
    cacheTimestamp = Date.now();

    return NextResponse.json(localities);
  } catch (error) {
    console.error("❌ Error fetching localities:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch localities",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

