import { NextResponse } from "next/server";

const DATA_URL =
  "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json";
const PINCODE_DATA_URL =
  "https://raw.githubusercontent.com/iaseth/pincodes-india/master/districts.json";
const NOMINATIM_USER_AGENT = "NextDoorJobs/1.0 (india-search)";
let statesCache = null;
let pincodeMapCache = null;
let lastNominatimCall = 0;
const MIN_NOMINATIM_INTERVAL_MS = 1100;
const geocodeCache = new Map();

function normalize(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function getStatesAndDistricts() {
  if (statesCache) return statesCache;
  const res = await fetch(DATA_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch states data");
  const data = await res.json();
  statesCache = data?.states || [];
  return statesCache;
}

/**
 * Returns { districtToPincode: Map(normalized "state|district" -> pincodeStart), stateToPincode: Map(normalized state -> first district pincode) }
 */
async function getPincodeMaps() {
  if (pincodeMapCache) return pincodeMapCache;
  const res = await fetch(PINCODE_DATA_URL, { next: { revalidate: 86400 } });
  if (!res.ok) {
    pincodeMapCache = { districtToPincode: new Map(), stateToPincode: new Map() };
    return pincodeMapCache;
  }
  const data = await res.json();
  const districts = data?.districts || [];
  const districtToPincode = new Map();
  const stateToPincode = new Map();
  for (const row of districts) {
    const stateName = row.stateName || "";
    const districtName = row.districtName || "";
    const pincode = row.pincodeStart || "";
    if (!pincode) continue;
    const stateNorm = normalize(stateName);
    const districtNorm = normalize(districtName);
    const key = `${stateNorm}|${districtNorm}`;
    if (!districtToPincode.has(key)) {
      districtToPincode.set(key, pincode);
    }
    if (stateNorm && !stateToPincode.has(stateNorm)) {
      stateToPincode.set(stateNorm, pincode);
    }
  }
  pincodeMapCache = { districtToPincode, stateToPincode };
  return pincodeMapCache;
}

async function delayForNominatim() {
  const now = Date.now();
  const elapsed = now - lastNominatimCall;
  if (elapsed < MIN_NOMINATIM_INTERVAL_MS) {
    await new Promise((r) =>
      setTimeout(r, MIN_NOMINATIM_INTERVAL_MS - elapsed)
    );
  }
  lastNominatimCall = Date.now();
}

async function geocode(query) {
  const key = query.trim().toLowerCase();
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key);
  }
  await delayForNominatim();
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    if (!res.ok) return null;
    const list = await res.json();
    const first = Array.isArray(list) && list.length ? list[0] : null;
    if (!first || first.lat == null || first.lon == null) {
      geocodeCache.set(key, null);
      return null;
    }
    const result = {
      lat: parseFloat(first.lat),
      lon: parseFloat(first.lon),
    };
    geocodeCache.set(key, result);
    return result;
  } catch (_) {
    geocodeCache.set(key, null);
    return null;
  }
}

/**
 * GET /api/india/search?q=thir
 * Returns suggestions for places in India: states, districts (from open JSON) and places (from Nominatim).
 * Each suggestion includes lat/lon for zoom. Caches Nominatim results.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const query = q.trim();
  const queryNorm = normalize(query);
  const suggestions = [];

  try {
    const [statesData, { districtToPincode, stateToPincode }] = await Promise.all([
      getStatesAndDistricts(),
      getPincodeMaps(),
    ]);

    const matchingStates = [];
    const matchingDistricts = [];

    for (const s of statesData) {
      const stateName = s.state || "";
      const stateNorm = normalize(stateName);
      if (stateNorm.includes(queryNorm) || queryNorm.includes(stateNorm)) {
        matchingStates.push({ name: stateName });
      }
      const districts = s.districts || [];
      for (const d of districts) {
        const districtName = typeof d === "string" ? d : d.name || "";
        const districtNorm = normalize(districtName);
        if (
          districtNorm.includes(queryNorm) ||
          queryNorm.includes(districtNorm)
        ) {
          matchingDistricts.push({
            name: districtName,
            state: stateName,
          });
        }
      }
    }

    const maxStates = 4;
    const maxDistricts = 8;
    const stateSlice = matchingStates.slice(0, maxStates);
    const districtSlice = matchingDistricts.slice(0, maxDistricts);

    for (const { name } of stateSlice) {
      const coords = await geocode(`${name}, India`);
      if (coords) {
        const stateNorm = normalize(name);
        const pincode = stateToPincode.get(stateNorm) || null;
        suggestions.push({
          type: "state",
          name,
          state: name,
          district: null,
          lat: coords.lat,
          lon: coords.lon,
          ...(pincode && { pincode }),
        });
      }
    }

    for (const { name, state } of districtSlice) {
      const coords = await geocode(`${name}, ${state}, India`);
      if (coords) {
        const key = `${normalize(state)}|${normalize(name)}`;
        const pincode = districtToPincode.get(key) || null;
        suggestions.push({
          type: "district",
          name,
          state,
          district: name,
          lat: coords.lat,
          lon: coords.lon,
          ...(pincode && { pincode }),
        });
      }
    }

    const placeQuery = `${query} India`;
    await delayForNominatim();
    const placeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeQuery)}&format=json&limit=5&countrycodes=in`;
    const placeRes = await fetch(placeUrl, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    if (placeRes.ok) {
      const placeList = await placeRes.json();
      const addr = (item) => item?.address || {};
      const stateFromAddr = (a) =>
        a.state || a.region || a["ISO3166-2-lvl4"] || "";
      for (const item of placeList || []) {
        if (item.lat == null || item.lon == null) continue;
        const a = addr(item);
        const stateName = stateFromAddr(a);
        const nameDisplay = item.display_name?.split(",")[0] || item.name || query;
        const postcode = a.postcode ? String(a.postcode).trim() : null;
        suggestions.push({
          type: "place",
          name: nameDisplay,
          state: stateName || "India",
          district: a.county || a.state_district || null,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          ...(postcode && { pincode: postcode }),
        });
      }
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("India search API error:", err?.message);
    return NextResponse.json({ suggestions: [] });
  }
}
