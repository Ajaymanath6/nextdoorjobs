import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import Fuse from "fuse.js";

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

// Search by college name with fuzzy matching
const searchByCollegeName = async (collegeName) => {
  // Normalize the search query
  const normalizedQuery = collegeName.trim().toLowerCase();
  
  // Check cache first (use exact query to avoid cache collisions)
  const exactName = collegeName.trim();
  const exactCacheKey = `college:exact:${exactName}`;
  const cached = searchCache.get(exactCacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Cache hit for college: "${collegeName}"`);
    console.log(`📦 Cached data:`, cached.data);
    // Verify cached data matches the search query
    if (cached.data.name.toLowerCase() !== exactName.toLowerCase()) {
      console.warn(`⚠️  Cache mismatch! Searched: "${exactName}", Cached: "${cached.data.name}"`);
      // Don't return mismatched cache
    } else {
      return cached.data;
    }
  }

  console.log(`🔍 Searching for college: "${collegeName}" (normalized: "${normalizedQuery}")`);

  let collegeData = null;

  try {
    // CRITICAL: Try exact match first (case-insensitive)
    // This ensures we get the correct college when user selects from autocomplete
    collegeData = await queryWithTimeout(async () => {
      try {
        // First, try exact match (most important for autocomplete selections)
        const exactMatch = await prisma.college.findFirst({
          where: {
            name: { equals: collegeName.trim(), mode: "insensitive" }
          }
        });
        
        if (exactMatch) {
          console.log(`✅ Found exact match: ${exactMatch.name}`);
          return exactMatch;
        }
        
        // If no exact match, try contains match
        const containsMatch = await prisma.college.findFirst({
          where: {
            name: { contains: normalizedQuery, mode: "insensitive" }
          },
          orderBy: [
            { name: 'asc' }
          ]
        });
        
        if (containsMatch) {
          console.log(`✅ Found contains match: ${containsMatch.name}`);
          return containsMatch;
        }
        
        // If still no match, try word-based search
        const words = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
        if (words.length > 0) {
          const wordConditions = words.map(word => ({
            name: { contains: word, mode: "insensitive" }
          }));
          
          const wordMatch = await prisma.college.findFirst({
            where: {
              OR: wordConditions
            },
            orderBy: [
              { name: 'asc' }
            ]
          });
          
          if (wordMatch) {
            console.log(`✅ Found word match: ${wordMatch.name}`);
            return wordMatch;
          }
        }
        
        return null;
      } catch (prismaError) {
        // Check if it's because college model doesn't exist
        if (prismaError.message && prismaError.message.includes('college')) {
          console.error("❌ prisma.college is not available. Prisma client needs regeneration and server restart.");
          throw new Error("College model not available. Please restart the development server.");
        }
        throw prismaError;
      }
    });

    // If exact match found, return it
    if (collegeData) {
      console.log(`✅ Found exact match: ${collegeData.name} (${collegeData.pincode})`);
    } else {
      // Try fuzzy search with fuse.js
      console.log(`   No exact match found. Trying fuzzy search...`);
      
      // Fetch all colleges for fuzzy search
      const allColleges = await queryWithTimeout(async () => {
        try {
          return await prisma.college.findMany({
            select: {
              id: true,
              name: true,
              category: true,
              pincode: true,
              locality: true,
              latitude: true,
              longitude: true,
            },
          });
        } catch (prismaError) {
          // Check if it's because college model doesn't exist
          if (prismaError.message && prismaError.message.includes('college')) {
            console.error("❌ prisma.college is not available. Prisma client needs regeneration and server restart.");
            throw new Error("College model not available. Please restart the development server.");
          }
          throw prismaError;
        }
      });

      if (allColleges.length > 0) {
        // Configure fuse.js for fuzzy matching
        const fuse = new Fuse(allColleges, {
          keys: ['name'],
          threshold: 0.3,
          includeScore: true,
          minMatchCharLength: 3,
          ignoreLocation: false,
          findAllMatches: true,
          shouldSort: true,
        });

        const results = fuse.search(collegeName.trim());
        
        if (results.length > 0) {
          // Score and rank results
          const scoredResults = results
            .filter(r => r.score < 0.5)
            .map(result => {
              const itemName = result.item.name.toLowerCase();
              const searchTerm = normalizedQuery;
              
              let bonus = 0;
              
              // Bonus for exact start match
              if (itemName.startsWith(searchTerm)) {
                bonus = -0.5;
              } else if (itemName.includes(searchTerm)) {
                bonus = -0.1;
              }
              
              // Penalty for very different lengths
              const lengthDiff = Math.abs(itemName.length - searchTerm.length);
              let lengthPenalty = 0;
              if (lengthDiff > 10) {
                lengthPenalty = 0.2;
              } else if (lengthDiff > 5) {
                lengthPenalty = 0.1;
              } else if (lengthDiff <= 2) {
                lengthPenalty = -0.05;
              }
              
              return {
                ...result,
                adjustedScore: result.score + bonus + lengthPenalty
              };
            })
            .sort((a, b) => a.adjustedScore - b.adjustedScore);
          
          if (scoredResults.length > 0 && scoredResults[0].adjustedScore < 0.5) {
            collegeData = scoredResults[0].item;
            console.log(`✅ Found fuzzy match: ${collegeData.name} (${collegeData.pincode}) - Score: ${scoredResults[0].score.toFixed(2)}, Adjusted: ${scoredResults[0].adjustedScore.toFixed(2)}`);
          } else {
            console.log(`   No good fuzzy match found (best adjusted score: ${scoredResults[0]?.adjustedScore?.toFixed(2) || 'N/A'})`);
          }
        }
      }
    }
  } catch (dbError) {
    console.error("❌ Database query error:", dbError);
    
    if (dbError.message === 'Query timeout') {
      console.log("   Retrying query...");
      try {
        collegeData = await queryWithTimeout(async () => {
          return await prisma.college.findFirst({
            where: {
              name: { contains: normalizedQuery, mode: "insensitive" }
            }
          });
        }, 15000);
        
        if (collegeData) {
          console.log(`✅ Retry successful: ${collegeData.name}`);
        }
      } catch (retryError) {
        console.error("❌ Retry failed:", retryError.message);
        throw new Error("Database query timeout");
      }
    } else {
      throw dbError;
    }
  }

  if (!collegeData) {
    return null;
  }

  const responseData = {
    name: collegeData.name,
    category: collegeData.category,
    pincode: collegeData.pincode,
    locality: collegeData.locality || null,
    latitude: collegeData.latitude ? parseFloat(collegeData.latitude) : null,
    longitude: collegeData.longitude ? parseFloat(collegeData.longitude) : null,
  };
  
  // Debug: Log the response data with full details
  console.log("📤 Returning college data:", {
    searchedFor: collegeName,
    found: responseData.name,
    latitude: responseData.latitude,
    longitude: responseData.longitude,
    pincode: responseData.pincode,
    locality: responseData.locality,
    latType: typeof responseData.latitude,
    lonType: typeof responseData.longitude,
    latValue: responseData.latitude,
    lonValue: responseData.longitude
  });
  
  // Verify we found the correct college
  if (responseData.name.toLowerCase() !== exactName.toLowerCase()) {
    console.warn(`⚠️  College name mismatch! Searched for: "${collegeName}", Found: "${responseData.name}"`);
  }

  // Cache the result with exact name as key to avoid collisions
  const exactCacheKey = `college:exact:${exactName}`;
  searchCache.set(exactCacheKey, {
    data: responseData,
    timestamp: Date.now()
  });
  
  // Also cache with normalized query for fuzzy searches
  const normalizedCacheKey = `college:${normalizedQuery}`;
  searchCache.set(normalizedCacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  return responseData;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("college");

    if (!input) {
      return NextResponse.json(
        { error: "College name is required" },
        { status: 400 }
      );
    }

    const trimmedInput = input.trim();
    let result = null;

    // Search by college name
    try {
      result = await searchByCollegeName(trimmedInput);
      
      if (!result) {
        return NextResponse.json(
          { error: `College "${trimmedInput}" not found in database` },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error("❌ Error searching college:", error);
      
      if (error.message === "Database query timeout") {
        return NextResponse.json(
          { 
            error: "Database query timeout", 
            details: "The database is taking too long to respond. Please try again." 
          },
          { status: 500 }
        );
      }
      
      if (error.message && error.message.includes("College model not available")) {
        return NextResponse.json(
          { 
            error: "College search is not available", 
            details: "Please restart the development server to load the College model. Run: npm run dev"
          },
          { status: 503 }
        );
      }
      
      throw error;
    }

    // Clean old cache entries (simple cleanup)
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error searching:", error);
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
