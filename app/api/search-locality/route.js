import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import Fuse from "fuse.js";

// Simple in-memory cache for search results
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting for external API calls
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 1000; // 1 second

// Query with timeout helper
const queryWithTimeout = async (queryFn, timeoutMs = 12000) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
  );
  return Promise.race([queryFn(), timeoutPromise]);
};

// Helper function to delay API calls for rate limiting
const delayForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
    const delay = MIN_API_CALL_INTERVAL - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastApiCallTime = Date.now();
};

// Map DB row (snake_case) to API response shape
const mapPincodeRow = (row) => {
  if (!row) return null;
  return {
    pincode: row.pincode,
    localityName: row.locality_name ?? row.localityName,
    district: row.district,
    state: row.state,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
  };
};

// Validate locality name to ensure it's not the PIN code itself
const isValidLocalityName = (localityName, pincode) => {
  if (!localityName || localityName === 'Unknown' || localityName.trim() === '') {
    return false;
  }
  // Check if locality name is just the PIN code
  if (localityName === pincode || localityName === pincode.toString()) {
    return false;
  }
  return true;
};

// Fetch PIN code data from India Post API (most accurate)
const fetchFromIndiaPostAPI = async (pincode) => {
  try {
    console.log(`   Trying India Post API for PIN: ${pincode}`);
    
    const url = `https://api.postalpincode.in/pincode/${pincode}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'mapmyGig/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`India Post API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0 || data[0].Status !== 'Success') {
      return null;
    }

    const postOffices = data[0].PostOffice;
    if (!postOffices || postOffices.length === 0) {
      return null;
    }

    // Use the first post office data
    const postOffice = postOffices[0];
    
    // Build locality name with description if available
    let localityName = postOffice.Name;
    if (postOffice.Description && postOffice.Description !== 'NA') {
      localityName = `${postOffice.Name} (${postOffice.Description})`;
    }

    // Validate locality name
    if (!isValidLocalityName(localityName, pincode)) {
      return null;
    }

    console.log(`   ✅ India Post API returned: ${localityName}`);

    return {
      pincode: pincode,
      localityName: localityName,
      district: postOffice.District || 'Unknown',
      state: postOffice.State || 'Kerala',
      latitude: null, // India Post API doesn't provide coordinates
      longitude: null,
      dataSource: 'india_post'
    };
  } catch (error) {
    console.error(`   ❌ India Post API failed:`, error.message);
    return null;
  }
};

// Fetch PIN code data from Zippopotam API (backup)
const fetchFromZippopotam = async (pincode) => {
  try {
    console.log(`   Trying Zippopotam API for PIN: ${pincode}`);
    
    const url = `https://api.zippopotam.us/in/${pincode}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'mapmyGig/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Zippopotam API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.places || data.places.length === 0) {
      return null;
    }

    const place = data.places[0];
    const localityName = place['place name'];

    // Validate locality name
    if (!isValidLocalityName(localityName, pincode)) {
      return null;
    }

    console.log(`   ✅ Zippopotam API returned: ${localityName}`);

    return {
      pincode: pincode,
      localityName: localityName,
      district: 'Unknown', // Zippopotam doesn't provide district
      state: place.state || 'Kerala',
      latitude: place.latitude ? parseFloat(place.latitude) : null,
      longitude: place.longitude ? parseFloat(place.longitude) : null,
      dataSource: 'zippopotam'
    };
  } catch (error) {
    console.error(`   ❌ Zippopotam API failed:`, error.message);
    return null;
  }
};

// Fetch PIN code data from Nominatim API (fallback)
const fetchFromNominatim = async (pincode) => {
  try {
    console.log(`   Trying Nominatim API for PIN: ${pincode}`);
    await delayForRateLimit();
    
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'mapmyGig/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    
    // Extract locality name from address field (priority order)
    let localityName = null;
    if (result.address) {
      localityName = result.address.village ||
                     result.address.suburb ||
                     result.address.town ||
                     result.address.city ||
                     result.address.municipality ||
                     result.address.hamlet;
    }
    
    // Fallback to display_name if address fields don't work
    if (!localityName) {
      const displayParts = result.display_name.split(',');
      localityName = displayParts[0]?.trim();
    }
    
    // Validate locality name
    if (!isValidLocalityName(localityName, pincode)) {
      return null;
    }

    // Try to extract district from address
    let district = 'Unknown';
    if (result.address) {
      district = result.address.county || 
                 result.address.state_district || 
                 result.address.district ||
                 'Unknown';
    }

    console.log(`   ✅ Nominatim API returned: ${localityName}`);

    return {
      pincode: pincode,
      localityName: localityName,
      district: district,
      state: "Kerala",
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      dataSource: 'nominatim'
    };
  } catch (error) {
    console.error(`   ❌ Nominatim API failed:`, error.message);
    return null;
  }
};

// Fetch coordinates for a PIN that has locality but no coordinates
const fetchCoordinatesOnly = async (pincode) => {
  try {
    // Try Zippopotam first (has coordinates)
    const zipData = await fetchFromZippopotam(pincode);
    if (zipData && zipData.latitude && zipData.longitude) {
      return { latitude: zipData.latitude, longitude: zipData.longitude };
    }

    // Try Nominatim
    await delayForRateLimit();
    const nomData = await fetchFromNominatim(pincode);
    if (nomData && nomData.latitude && nomData.longitude) {
      return { latitude: nomData.latitude, longitude: nomData.longitude };
    }

    return null;
  } catch (error) {
    console.error(`   ❌ Failed to fetch coordinates:`, error.message);
    return null;
  }
};

// Search by PIN code with multiple API fallbacks
const searchByPincode = async (pincode) => {
  // Check cache first
  const cacheKey = `pin:${pincode}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Cache hit for PIN: "${pincode}"`);
    return cached.data;
  }

  console.log(`🔍 Searching for PIN: "${pincode}"`);

    // First, try to find in database
    try {
      const pincodeData = await queryWithTimeout(async () => {
        if (prisma.pincode) {
          return await prisma.pincode.findUnique({
            where: { pincode: pincode }
          });
        }
        const rows = await prisma.$queryRaw`
          SELECT pincode, locality_name, district, state, latitude, longitude
          FROM pincodes
          WHERE pincode = ${pincode}
          LIMIT 1
        `;
        const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
        return row ? mapPincodeRow(row) : null;
      });

    if (pincodeData) {
      console.log(`✅ Found PIN in DB: ${pincodeData.localityName} (${pincodeData.pincode})`);
      
      // If coordinates are missing, try to fetch them
      if (!pincodeData.latitude || !pincodeData.longitude) {
        console.log(`   Coordinates missing, attempting to fetch...`);
        const coords = await fetchCoordinatesOnly(pincode);
        if (coords) {
          pincodeData.latitude = coords.latitude;
          pincodeData.longitude = coords.longitude;
          if (prisma.pincode) {
            try {
              await prisma.pincode.update({
                where: { pincode: pincode },
                data: { latitude: coords.latitude, longitude: coords.longitude }
              });
              console.log(`   ✅ Updated coordinates in DB`);
            } catch (updateError) {
              console.error(`   ❌ Failed to update coordinates:`, updateError.message);
            }
          }
        }
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

      return responseData;
    }
  } catch (dbError) {
    console.error("❌ Database query error for PIN:", dbError);
    // Continue to external API fetch as fallback
  }

  // PIN not found in database, try multiple APIs
  console.log(`   PIN not in DB. Fetching from external APIs...`);
  
  let externalData = null;
  
  // Try APIs in priority order
  externalData = await fetchFromIndiaPostAPI(pincode);
  
  if (!externalData) {
    externalData = await fetchFromZippopotam(pincode);
  }
  
  if (!externalData) {
    externalData = await fetchFromNominatim(pincode);
  }
  
  // If all APIs failed or returned invalid data
  if (!externalData) {
    console.error(`   ❌ All APIs failed or returned invalid data for PIN: ${pincode}`);
    return null;
  }

  // If we got data from India Post (no coordinates), try to fetch coordinates
  if (externalData.dataSource === 'india_post' && (!externalData.latitude || !externalData.longitude)) {
    console.log(`   Fetching coordinates for India Post data...`);
    const coords = await fetchCoordinatesOnly(pincode);
    if (coords) {
      externalData.latitude = coords.latitude;
      externalData.longitude = coords.longitude;
    }
  }

  // Save to database for future use (skip when delegate missing; still return data)
  const responseFromExternal = {
    pincode: externalData.pincode,
    localityName: externalData.localityName,
    district: externalData.district,
    state: externalData.state,
    latitude: externalData.latitude,
    longitude: externalData.longitude,
  };

  if (!prisma.pincode) {
    searchCache.set(cacheKey, { data: responseFromExternal, timestamp: Date.now() });
    return responseFromExternal;
  }

  try {
    const savedData = await prisma.pincode.create({
      data: {
        pincode: externalData.pincode,
        localityName: externalData.localityName,
        district: externalData.district,
        state: externalData.state,
        latitude: externalData.latitude,
        longitude: externalData.longitude,
      }
    });
    console.log(`✅ Saved new PIN to DB: ${savedData.localityName} (${savedData.pincode}) [Source: ${externalData.dataSource}]`);
    const responseData = {
      pincode: savedData.pincode,
      localityName: savedData.localityName,
      district: savedData.district,
      state: savedData.state,
      latitude: savedData.latitude,
      longitude: savedData.longitude,
    };
    searchCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return responseData;
  } catch (saveError) {
    if (saveError.code === "P2002") {
      console.log("   PIN already exists, fetching from DB...");
      const existingData = prisma.pincode
        ? await prisma.pincode.findUnique({ where: { pincode: pincode } })
        : (await prisma.$queryRaw`SELECT pincode, locality_name, district, state, latitude, longitude FROM pincodes WHERE pincode = ${pincode} LIMIT 1`)?.[0];
      const existing = existingData ? mapPincodeRow(existingData) : null;
      if (existing) {
        searchCache.set(cacheKey, { data: existing, timestamp: Date.now() });
        return existing;
      }
    }
    throw saveError;
  }
};

// Search by locality name with improved fuzzy matching
const searchByLocality = async (localityName) => {
  // Normalize the search query
  const normalizedQuery = localityName.trim().toLowerCase();
  
  // Check cache first
  const cacheKey = `locality:${normalizedQuery}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Cache hit for locality: "${localityName}"`);
    return cached.data;
  }

  console.log(`🔍 Searching for locality: "${localityName}" (normalized: "${normalizedQuery}")`);

  let pincodeData = null;

  // Prepare search terms outside try block so they're available in catch block
  const searchTerms = normalizedQuery.split('/').map(s => s.trim()).filter(Boolean);
  const wordTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 2);

  try {
    // First, try exact/contains match on localityName and district (so city names like Kochi work)
    const orConditions = [
      { localityName: { equals: localityName.trim(), mode: "insensitive" } },
      { localityName: { contains: normalizedQuery, mode: "insensitive" } },
      { district: { equals: localityName.trim(), mode: "insensitive" } },
      { district: { contains: normalizedQuery, mode: "insensitive" } },
    ];
    
    // Only add additional conditions if the query is short (to avoid too many OR conditions)
    if (normalizedQuery.length <= 20) {
      searchTerms.forEach(term => {
        if (term && term.length > 2) {
          orConditions.push({ localityName: { contains: term.trim(), mode: "insensitive" } });
          orConditions.push({ district: { contains: term.trim(), mode: "insensitive" } });
        }
      });
    }
    
    pincodeData = await queryWithTimeout(async () => {
      if (prisma.pincode) {
        return await prisma.pincode.findFirst({
          where: {
            AND: [
              { OR: orConditions.slice(0, 8) },
              { state: "Kerala" }
            ]
          },
          orderBy: [{ localityName: "asc" }],
          take: 1
        });
      }
      // Fallback: raw query when delegate is missing (e.g. stale Next.js cache)
      const escaped = normalizedQuery.replace(/%/g, "\\%").replace(/_/g, "\\_");
      const pattern = `%${escaped}%`;
      const rows = await prisma.$queryRaw`
        SELECT pincode, locality_name, district, state, latitude, longitude
        FROM pincodes
        WHERE state = 'Kerala'
          AND (locality_name ILIKE ${pattern} OR district ILIKE ${pattern})
        ORDER BY locality_name ASC
        LIMIT 1
      `;
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      return row ? mapPincodeRow(row) : null;
    }, 8000);

    // If exact match found, return it
    if (pincodeData) {
      console.log(`✅ Found exact match: ${pincodeData.localityName} (${pincodeData.pincode})`);
    } else {
      // Try fuzzy search with fuse.js - but only if query is reasonable length
      if (normalizedQuery.length > 3 && normalizedQuery.length < 50) {
        console.log(`   No exact match found. Trying fuzzy search...`);
        
        // Fetch Kerala pincodes for fuzzy search (limit to reasonable number)
        const prefix = normalizedQuery.substring(0, 3);
        const prefixPattern = `${prefix}%`;
        const keralaPincodes = await queryWithTimeout(async () => {
          if (prisma.pincode) {
            return await prisma.pincode.findMany({
              where: {
                state: "Kerala",
                localityName: { startsWith: prefix, mode: "insensitive" }
              },
              select: {
                id: true,
                pincode: true,
                localityName: true,
                district: true,
                state: true,
                latitude: true,
                longitude: true,
              },
              take: 1000
            });
          }
          const rows = await prisma.$queryRaw`
            SELECT pincode, locality_name as "localityName", district, state, latitude, longitude
            FROM pincodes
            WHERE state = 'Kerala' AND (locality_name ILIKE ${prefixPattern} OR district ILIKE ${prefixPattern})
            ORDER BY locality_name ASC
            LIMIT 1000
          `;
          return (Array.isArray(rows) ? rows : []).map(mapPincodeRow);
        }, 8000);

        if (keralaPincodes && keralaPincodes.length > 0) {
          // Configure fuse.js for fuzzy matching - stricter settings
          const fuse = new Fuse(keralaPincodes, {
            keys: ['localityName'],
            threshold: 0.3, // Stricter: 0.3 instead of 0.4
            includeScore: true,
            minMatchCharLength: 3,
            ignoreLocation: false, // Consider position of match
            findAllMatches: true, // Get multiple results to choose best
            shouldSort: true,
          });

          const results = fuse.search(localityName.trim());
          
          if (results.length > 0) {
            // Score and rank results with better heuristics
            const scoredResults = results
              .filter(r => r.score < 0.5) // Stricter score threshold
              .map(result => {
                const itemName = result.item.localityName.toLowerCase();
                const searchTerm = normalizedQuery;
                
                // Calculate various matching factors
                let bonus = 0;
                
                // STRONG bonus for exact start match (e.g., "malapuram" starts "malappuram")
                if (itemName.startsWith(searchTerm)) {
                  bonus = -0.5; // Very strong bonus
                } 
                // Check if any word in the locality starts with search term
                else {
                  const words = itemName.split(/[\s\/,]+/);
                  const startsWithWord = words.some(word => word.startsWith(searchTerm));
                  if (startsWithWord) {
                    bonus = -0.3; // Strong bonus for word-start match
                  } else if (itemName.includes(searchTerm)) {
                    // Substring match but not at start - small bonus
                    bonus = -0.05;
                  }
                }
                
                // Penalty for very different lengths
                const lengthDiff = Math.abs(itemName.length - searchTerm.length);
                let lengthPenalty = 0;
                if (lengthDiff > 10) {
                  lengthPenalty = 0.2; // Big difference
                } else if (lengthDiff > 5) {
                  lengthPenalty = 0.1; // Moderate difference
                } else if (lengthDiff <= 2) {
                  lengthPenalty = -0.05; // Very similar length - bonus
                }
                
                // Additional penalty if match is in the middle/end (not start)
                let positionPenalty = 0;
                if (!itemName.startsWith(searchTerm) && itemName.includes(searchTerm)) {
                  const position = itemName.indexOf(searchTerm);
                  // Penalize matches that appear later in the string
                  positionPenalty = position > 0 ? 0.15 : 0;
                }
                
                return {
                  ...result,
                  adjustedScore: result.score + bonus + lengthPenalty + positionPenalty
                };
              })
              .sort((a, b) => a.adjustedScore - b.adjustedScore); // Sort by adjusted score
            
            if (scoredResults.length > 0 && scoredResults[0].adjustedScore < 0.5) {
              pincodeData = scoredResults[0].item;
              console.log(`✅ Found fuzzy match: ${pincodeData.localityName} (${pincodeData.pincode}) - Score: ${scoredResults[0].score.toFixed(2)}, Adjusted: ${scoredResults[0].adjustedScore.toFixed(2)}`);
            } else {
              console.log(`   No good fuzzy match found (best adjusted score: ${scoredResults[0]?.adjustedScore?.toFixed(2) || 'N/A'})`);
            }
          }
        }
      }
    }
  } catch (dbError) {
    console.error("❌ Database query error:", dbError);
    
    if (dbError.message === "Query timeout") {
      console.log("   Retrying with simpler query...");
      try {
        const pattern = `%${normalizedQuery.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
        pincodeData = await queryWithTimeout(async () => {
          if (prisma.pincode) {
            return await prisma.pincode.findFirst({
              where: {
                AND: [
                  {
                    OR: [
                      { localityName: { equals: localityName.trim(), mode: "insensitive" } },
                      { localityName: { contains: normalizedQuery, mode: "insensitive" } },
                      { district: { contains: normalizedQuery, mode: "insensitive" } },
                    ]
                  },
                  { state: "Kerala" }
                ]
              },
              orderBy: { localityName: "asc" },
              take: 1
            });
          }
          const rows = await prisma.$queryRaw`
            SELECT pincode, locality_name, district, state, latitude, longitude
            FROM pincodes
            WHERE state = 'Kerala'
              AND (locality_name ILIKE ${pattern} OR district ILIKE ${pattern})
            ORDER BY locality_name ASC
            LIMIT 1
          `;
          const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
          return row ? mapPincodeRow(row) : null;
        }, 6000);
        
        if (pincodeData) {
          console.log(`✅ Retry successful: ${pincodeData.localityName}`);
        } else {
          throw new Error("Database query timeout - no results found");
        }
      } catch (retryError) {
        console.error("❌ Retry failed:", retryError.message);
        throw new Error("Database query timeout");
      }
    } else {
      throw dbError;
    }
  }

  if (!pincodeData) {
    return null;
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

  return responseData;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("locality");

    if (!input) {
      return NextResponse.json(
        { error: "Locality name or PIN code is required" },
        { status: 400 }
      );
    }

    const trimmedInput = input.trim();
    let result = null;

    // Detect if input is a 6-digit PIN code
    const isPincode = /^\d{6}$/.test(trimmedInput);

    if (isPincode) {
      // Search by PIN code
      try {
        result = await searchByPincode(trimmedInput);
        
        if (!result) {
          return NextResponse.json(
            { error: `PIN code "${trimmedInput}" not found. Please verify the PIN code.` },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("❌ Error searching PIN:", error);
        
        // Check if it's an external API error
        if (error.message.includes('API') || error.message.includes('fetch')) {
          return NextResponse.json(
            { 
              error: "Unable to fetch PIN code information. Please try again later.",
              details: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 503 }
          );
        }
        
        throw error;
      }
    } else {
      // Search by locality name
      try {
        result = await searchByLocality(trimmedInput);
        
        if (!result) {
          return NextResponse.json(
            { error: `Locality "${trimmedInput}" not found in database` },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("❌ Error searching locality:", error);

        if (error.message === "Database query timeout" || error.message === "Database query timeout - no results found") {
          return NextResponse.json(
            {
              error: "Database query timeout",
              details: "The database is taking too long to respond. Please try again.",
            },
            { status: 500 }
          );
        }

        if (error.message && error.message.includes("Query timeout")) {
          return NextResponse.json(
            {
              error: "Search timed out",
              details: "The search took too long. Please try a more specific locality or try again.",
            },
            { status: 504 }
          );
        }

        throw error;
      }
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
