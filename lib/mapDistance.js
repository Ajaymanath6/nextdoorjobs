export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getItemCoords(item) {
  const lat = item?.latitude ?? item?.lat ?? item?.homeLatitude;
  const lon = item?.longitude ?? item?.lon ?? item?.homeLongitude;
  if (lat == null || lon == null) return null;
  const latN = Number(lat);
  const lonN = Number(lon);
  if (!Number.isFinite(latN) || !Number.isFinite(lonN)) return null;
  return { lat: latN, lon: lonN };
}

export function filterByRadius(items, anchorLat, anchorLon, radiusKm) {
  if (!radiusKm || !items?.length) return items || [];
  if (anchorLat == null || anchorLon == null) return items;
  return items.filter((item) => {
    const coords = getItemCoords(item);
    if (!coords) return false;
    return haversineKm(anchorLat, anchorLon, coords.lat, coords.lon) <= radiusKm;
  });
}

export function getRadiusAnchor(homeLocation, mapInstance) {
  if (
    homeLocation?.homeLatitude != null &&
    homeLocation?.homeLongitude != null &&
    Number.isFinite(Number(homeLocation.homeLatitude)) &&
    Number.isFinite(Number(homeLocation.homeLongitude))
  ) {
    return {
      lat: Number(homeLocation.homeLatitude),
      lon: Number(homeLocation.homeLongitude),
      source: "home",
    };
  }
  if (mapInstance?.getCenter) {
    const center = mapInstance.getCenter();
    if (center?.lat != null && center?.lng != null) {
      return { lat: center.lat, lon: center.lng, source: "map" };
    }
  }
  return null;
}
