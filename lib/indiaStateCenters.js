/**
 * Approximate geographic center [lat, lon] for each Indian state and UT.
 * Used to pan the map when user selects a state in the filter.
 * State names must match the sab99r/Indian-States-And-Districts JSON.
 */
const STATE_CENTERS = {
  "Andhra Pradesh": [16.5, 80.6],
  "Arunachal Pradesh": [27.1, 93.7],
  Assam: [26.2, 92.9],
  Bihar: [25.1, 85.3],
  "Chandigarh (UT)": [30.74, 76.78],
  Chhattisgarh: [21.3, 81.6],
  "Dadra and Nagar Haveli (UT)": [20.2, 73.1],
  "Daman and Diu (UT)": [20.4, 72.8],
  "Delhi (NCT)": [28.61, 77.21],
  Goa: [15.3, 74.1],
  Gujarat: [22.3, 71.5],
  Haryana: [29.0, 76.1],
  "Himachal Pradesh": [31.1, 77.2],
  "Jammu and Kashmir": [33.4, 75.5],
  Jharkhand: [23.4, 85.3],
  Karnataka: [15.0, 76.4],
  Kerala: [10.5276, 76.2144],
  "Lakshadweep (UT)": [10.6, 72.6],
  "Madhya Pradesh": [22.7, 78.0],
  Maharashtra: [19.1, 74.9],
  Manipur: [24.8, 93.9],
  Meghalaya: [25.6, 91.9],
  Mizoram: [23.2, 92.9],
  Nagaland: [26.2, 94.6],
  Odisha: [20.3, 85.8],
  "Puducherry (UT)": [11.9, 79.8],
  Punjab: [31.1, 75.5],
  Rajasthan: [26.9, 75.8],
  Sikkim: [27.3, 88.6],
  "Tamil Nadu": [11.0, 78.0],
  Telangana: [17.4, 78.5],
  Tripura: [23.8, 91.3],
  Uttarakhand: [30.1, 79.0],
  "Uttar Pradesh": [26.8, 80.9],
  "West Bengal": [22.6, 88.4],
};

const DEFAULT_ZOOM = 7;

/**
 * @param {string} stateName - State name as from filter (e.g. "Kerala", "Karnataka")
 * @returns {{ center: [number, number], zoom: number } | null}
 */
export function getStateCenter(stateName) {
  if (!stateName || typeof stateName !== "string") return null;
  const trimmed = stateName.trim();
  const center = STATE_CENTERS[trimmed];
  if (center) return { center, zoom: DEFAULT_ZOOM };
  return null;
}

export default STATE_CENTERS;
