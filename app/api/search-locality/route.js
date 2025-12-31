import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const localityName = searchParams.get("locality");

    if (!localityName) {
      return NextResponse.json(
        { error: "Locality name is required" },
        { status: 400 }
      );
    }

    // Normalize the search query
    const normalizedQuery = localityName.trim().toLowerCase();

    console.log(`🔍 Searching for locality: "${localityName}" (normalized: "${normalizedQuery}")`);

    let pincodeData = null;

    try {
      // Search for locality in database (case-insensitive)
      // Try exact match first
      pincodeData = await prisma.pincode.findFirst({
        where: {
          localityName: {
            equals: localityName.trim(),
            mode: "insensitive",
          },
        },
      });

      console.log(`   Exact match result: ${pincodeData ? `Found: ${pincodeData.localityName}` : "Not found"}`);

      // If not found, try contains search
      if (!pincodeData) {
        pincodeData = await prisma.pincode.findFirst({
          where: {
            localityName: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        });
        console.log(`   Contains match result: ${pincodeData ? `Found: ${pincodeData.localityName}` : "Not found"}`);
      }

      // If still not found, try searching for the query as a substring in any part of the locality name
      if (!pincodeData) {
        const allPincodes = await prisma.pincode.findMany({
          where: {
            district: "Thrissur",
            state: "Kerala",
          },
        });

        // Manual search for better matching
        pincodeData = allPincodes.find((p) =>
          p.localityName.toLowerCase().includes(normalizedQuery)
        ) || null;
        console.log(`   Manual search result: ${pincodeData ? `Found: ${pincodeData.localityName}` : "Not found"}`);
      }
    } catch (dbError) {
      console.error("❌ Database query error:", dbError);
      console.error("   Database error details:", {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
      });
      return NextResponse.json(
        { 
          error: "Database query failed", 
          details: process.env.NODE_ENV === "development" ? dbError.message : undefined 
        },
        { status: 500 }
      );
    }

    if (!pincodeData) {
      console.error(`❌ Locality not found: "${localityName}"`);
      return NextResponse.json(
        { error: `Locality "${localityName}" not found in database` },
        { status: 404 }
      );
    }

    console.log(`✅ Found: ${pincodeData.localityName} (${pincodeData.pincode}) - ${pincodeData.district}, ${pincodeData.state}`);

    return NextResponse.json({
      pincode: pincodeData.pincode,
      localityName: pincodeData.localityName,
      district: pincodeData.district,
      state: pincodeData.state,
      latitude: pincodeData.latitude,
      longitude: pincodeData.longitude,
    });
  } catch (error) {
    console.error("❌ Error searching locality:", error);
    console.error("   Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

