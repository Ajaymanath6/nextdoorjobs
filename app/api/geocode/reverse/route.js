import { NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "NextDoorJobs/1.0 (reverse geocoding)";
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL_MS = 1100;

const delayForRateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastApiCallTime;
  if (elapsed < MIN_API_CALL_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_API_CALL_INTERVAL_MS - elapsed));
  }
  lastApiCallTime = Date.now();
};

/**
 * GET /api/geocode/reverse?lat=10.5276&lon=76.2144
 * Returns { state, district, locality, postcode } (or nulls on failure).
 * Uses Nominatim (OpenStreetMap) reverse geocoding; no API key required.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (lat == null || lon == null) {
    return NextResponse.json(
      { error: "Missing lat or lon query parameter" },
      { status: 400 }
    );
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (
    Number.isNaN(latNum) ||
    Number.isNaN(lonNum) ||
    latNum < -90 ||
    latNum > 90 ||
    lonNum < -180 ||
    lonNum > 180
  ) {
    return NextResponse.json(
      { error: "Invalid lat or lon value" },
      { status: 400 }
    );
  }

  try {
    await delayForRateLimit();
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lonNum}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });

    if (!response.ok) {
      return NextResponse.json(
        { state: null, district: null, locality: null, postcode: null },
        { status: 200 }
      );
    }

    const data = await response.json();
    const addr = data?.address;
    if (!addr) {
      return NextResponse.json({
        state: null,
        district: null,
        locality: null,
        postcode: null,
      });
    }

    const state = addr.state || addr.region || null;
    const district =
      addr.county ||
      addr.state_district ||
      addr.district ||
      addr.municipality ||
      null;
    const locality =
      addr.village ||
      addr.suburb ||
      addr.town ||
      addr.city ||
      addr.hamlet ||
      null;
    const postcode = addr.postcode ? String(addr.postcode).trim() : null;

    return NextResponse.json({
      state,
      district,
      locality,
      postcode,
    });
  } catch (err) {
    console.error("Reverse geocode error:", err?.message);
    return NextResponse.json({
      state: null,
      district: null,
      locality: null,
      postcode: null,
    });
  }
}
