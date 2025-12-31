import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Simple in-memory cache for search results
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Query with timeout helper
const queryWithTimeout = async (queryFn, timeoutMs = 12000) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
  );
  return Promise.race([queryFn(), timeoutPromise]);
};

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
    
    // Check cache first
    const cacheKey = normalizedQuery;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for: "${localityName}"`);
      return NextResponse.json(cached.data);
    }

    console.log(`🔍 Searching for locality: "${localityName}" (normalized: "${normalizedQuery}")`);

    // Split multi-part locality names (e.g., "Puthur / Kuttanellur / Mannamangalam")
    const searchTerms = normalizedQuery.split('/').map(s => s.trim()).filter(Boolean);
    console.log(`   Search terms: [${searchTerms.join(', ')}]`);

    let pincodeData = null;

    try {
      // Single optimized query with OR conditions
      // Build OR conditions for all search terms
      const orConditions = [
        // Exact match (highest priority)
        { localityName: { equals: localityName.trim(), mode: "insensitive" } },
        // Contains match for full query
        { localityName: { contains: normalizedQuery, mode: "insensitive" } }
      ];
      
      // Add conditions for each part of multi-part names
      searchTerms.forEach(term => {
        if (term && term.length > 0) {
          orConditions.push({ localityName: { contains: term, mode: "insensitive" } });
        }
      });
      
      pincodeData = await queryWithTimeout(async () => {
        return await prisma.pincode.findFirst({
          where: {
            AND: [
              { OR: orConditions },
              { district: "Thrissur" },
              { state: "Kerala" }
            ]
          },
          orderBy: [
            { localityName: 'asc' }
          ]
        });
      });

      if (pincodeData) {
        console.log(`✅ Found: ${pincodeData.localityName} (${pincodeData.pincode}) - ${pincodeData.district}, ${pincodeData.state}`);
      } else {
        console.log(`   No match found for: "${localityName}"`);
      }
    } catch (dbError) {
      console.error("❌ Database query error:", dbError);
      console.error("   Database error details:", {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
      });
      
      // Retry once on timeout
      if (dbError.message === 'Query timeout') {
        console.log("   Retrying query...");
        try {
          pincodeData = await queryWithTimeout(async () => {
            return await prisma.pincode.findFirst({
              where: {
                AND: [
                  {
                    OR: searchTerms.map(term => ({
                      localityName: { contains: term, mode: "insensitive" }
                    }))
                  },
                  { district: "Thrissur" },
                  { state: "Kerala" }
                ]
              }
            });
          }, 15000); // Longer timeout for retry
          
          if (pincodeData) {
            console.log(`✅ Retry successful: ${pincodeData.localityName}`);
          }
        } catch (retryError) {
          console.error("❌ Retry failed:", retryError.message);
          return NextResponse.json(
            { 
              error: "Database query timeout", 
              details: "The database is taking too long to respond. Please try again." 
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: "Database query failed", 
            details: process.env.NODE_ENV === "development" ? dbError.message : undefined 
          },
          { status: 500 }
        );
      }
    }

    if (!pincodeData) {
      console.error(`❌ Locality not found: "${localityName}"`);
      return NextResponse.json(
        { error: `Locality "${localityName}" not found in database` },
        { status: 404 }
      );
    }

    const responseData = {
      pincode: pincodeData.pincode,
      localityName: pincodeData.localityName,
      district: pincodeData.district,
      state: pincodeData.state,
      latitude: pincodeData.latitude,
      longitude: pincodeData.longitude,
    };

    // Cache the result
    searchCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean old cache entries (simple cleanup)
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }

    return NextResponse.json(responseData);
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

