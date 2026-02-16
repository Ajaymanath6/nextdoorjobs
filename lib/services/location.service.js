import { prisma } from '../prisma';
import { cacheService } from './cache.service';

/**
 * LocationService - Business logic for location/pincode operations
 * 
 * Handles location queries with caching for static geographic data.
 */
class LocationService {
  /**
   * Get all localities for a state
   * @param {string} state - State name (default: "Kerala")
   * @returns {Promise<Array>} - Localities with pincode, district, coordinates (cached)
   */
  async getAllLocalities(state = "Kerala") {
    const cacheKey = `localities:${state}`;
    
    return cacheService.wrap(
      cacheKey,
      3600, // 1 hour (static data)
      () => {
        console.log(`🔍 Fetching localities from database for state: ${state}`);
        return prisma.pincode.findMany({
          where: { state },
          select: {
            pincode: true,
            localityName: true,
            district: true,
            state: true,
            latitude: true,
            longitude: true,
          },
          orderBy: [
            { district: 'asc' },
            { localityName: 'asc' },
          ],
        });
      }
    );
  }

  /**
   * Get pincode information by pincode
   * @param {string} pincode - Pincode to lookup
   * @returns {Promise<object|null>} - Pincode info with locality, district, coordinates (cached)
   */
  async getPincodeInfo(pincode) {
    if (!pincode || typeof pincode !== 'string') return null;
    
    const cacheKey = `pincode:${pincode.trim()}`;
    
    return cacheService.wrap(
      cacheKey,
      3600, // 1 hour (static data)
      () => prisma.pincode.findUnique({
        where: { pincode: pincode.trim() },
        select: {
          pincode: true,
          localityName: true,
          district: true,
          state: true,
          latitude: true,
          longitude: true,
        },
      })
    );
  }

  /**
   * Get all pincodes for a district
   * @param {string} district - District name
   * @param {string} state - State name (optional)
   * @returns {Promise<Array>} - Pincodes in district (cached)
   */
  async getDistrictPincodes(district, state = null) {
    const cacheKey = state 
      ? `pincodes:district:${district}:state:${state}`
      : `pincodes:district:${district}`;
    
    return cacheService.wrap(
      cacheKey,
      3600, // 1 hour (static data)
      () => {
        const where = { district };
        if (state) where.state = state;
        
        return prisma.pincode.findMany({
          where,
          select: {
            pincode: true,
            localityName: true,
            district: true,
            state: true,
            latitude: true,
            longitude: true,
          },
          orderBy: { localityName: 'asc' },
        });
      }
    );
  }

  /**
   * Search pincodes by locality name
   * @param {string} query - Search query
   * @param {string} state - State filter (optional)
   * @returns {Promise<Array>} - Matching pincodes
   */
  async searchLocalities(query, state = null) {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return [];
    }
    
    const where = {
      localityName: {
        contains: query.trim(),
        mode: 'insensitive',
      },
    };
    if (state) where.state = state;
    
    return prisma.pincode.findMany({
      where,
      select: {
        pincode: true,
        localityName: true,
        district: true,
        state: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { localityName: 'asc' },
      take: 50,
    });
  }

  /**
   * Get pincodes for a district (limited results)
   * @param {string} district - District name
   * @param {string} state - State name
   * @param {number} limit - Maximum number of pincodes to return (default: 4)
   * @returns {Promise<Array>} - Array of pincode strings (cached 1 hour)
   */
  async getPincodesByDistrict(district, state, limit = 4) {
    if (!district?.trim() || !state?.trim()) {
      return [];
    }

    const cacheKey = `pincodes:district:${district.trim()}:state:${state.trim()}:limit:${limit}`;
    
    return cacheService.wrap(
      cacheKey,
      3600, // 1 hour (static data)
      async () => {
        const rows = await prisma.pincode.findMany({
          where: {
            district: { equals: district.trim(), mode: 'insensitive' },
            state: { equals: state.trim(), mode: 'insensitive' },
          },
          distinct: ['pincode'],
          select: { pincode: true },
          take: limit,
          orderBy: { pincode: 'asc' },
        });

        return rows.map((r) => r.pincode);
      }
    );
  }
}

export const locationService = new LocationService();
