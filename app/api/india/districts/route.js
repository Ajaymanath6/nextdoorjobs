import { NextResponse } from "next/server";

const DATA_URL = "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json";
let cachedData = null;

async function getStatesAndDistricts() {
  if (cachedData) return cachedData;
  const res = await fetch(DATA_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch districts data");
  const data = await res.json();
  cachedData = data?.states || [];
  return cachedData;
}

function normalizeStateName(name) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * GET /api/india/districts?state=Kerala
 * Returns { districts: string[] } for the given Indian state.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const stateQuery = searchParams.get("state");
  if (!stateQuery || !stateQuery.trim()) {
    return NextResponse.json({ districts: [] });
  }
  try {
    const states = await getStatesAndDistricts();
    const normalizedQuery = normalizeStateName(stateQuery);
    const found = states.find(
      (s) =>
        normalizeStateName(s.state) === normalizedQuery ||
        normalizeStateName(s.state).startsWith(normalizedQuery) ||
        normalizedQuery.startsWith(normalizeStateName(s.state))
    );
    const districts = found?.districts || [];
    return NextResponse.json({ districts });
  } catch (err) {
    console.error("India districts API error:", err?.message);
    return NextResponse.json({ districts: [] });
  }
}
