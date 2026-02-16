import { prisma } from '../prisma';
import { cacheService } from './cache.service';

/**
 * GigService - Business logic for gig operations
 * 
 * Handles gig CRUD operations with caching and cache invalidation.
 */
class GigService {
  /**
   * Create a new gig for a user
   * @param {number} userId - User ID
   * @param {object} data - Gig data (title, description, serviceType, etc.)
   * @returns {Promise<object>} - Created gig with user info
   */
  async createGig(userId, data) {
    const gig = await prisma.gig.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        serviceType: data.serviceType,
        expectedSalary: data.expectedSalary,
        experienceWithGig: data.experienceWithGig,
        customersTillDate: data.customersTillDate,
        state: data.state,
        district: data.district,
        pincode: data.pincode,
        locality: data.locality,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarId: true, avatarUrl: true },
        },
      },
    });

    // Invalidate user's gigs cache
    await cacheService.del(`gigs:user:${userId}`);
    
    // Invalidate location-based caches for this gig's location
    if (data.state || data.district || data.pincode) {
      const state = data.state || 'all';
      const district = data.district || 'all';
      const pincode = data.pincode || 'all';
      await cacheService.del(`gigs:location:${state}:${district}:${pincode}`);
      
      // Also invalidate broader location queries
      if (data.state && data.district) {
        await cacheService.del(`gigs:location:${data.state}:${data.district}:all`);
      }
      if (data.state) {
        await cacheService.del(`gigs:location:${data.state}:all:all`);
      }
    }
    
    return gig;
  }

  /**
   * Get all gigs for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User's gigs (cached)
   */
  async getUserGigs(userId) {
    return cacheService.wrap(
      `gigs:user:${userId}`,
      300, // 5 minutes
      () => prisma.gig.findMany({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, avatarId: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  /**
   * Get gigs filtered by location
   * @param {object} filters - Location filters (state, district, pincode)
   * @returns {Promise<Array>} - Filtered gigs (cached)
   */
  async getGigsByLocation(filters) {
    const { state, district, pincode } = filters;
    const cacheKey = `gigs:location:${state || 'all'}:${district || 'all'}:${pincode || 'all'}`;
    
    return cacheService.wrap(
      cacheKey,
      300, // 5 minutes
      () => {
        const where = {};
        if (state && state.trim()) {
          where.state = { equals: state.trim(), mode: 'insensitive' };
        }
        if (district && district.trim()) {
          where.district = { equals: district.trim(), mode: 'insensitive' };
        }
        if (pincode && pincode.trim()) {
          where.pincode = pincode.trim();
        }

        return prisma.gig.findMany({
          where: Object.keys(where).length ? where : undefined,
          include: {
            user: {
              select: { id: true, name: true, avatarId: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    );
  }

  /**
   * Get a single gig by ID
   * @param {number} id - Gig ID
   * @returns {Promise<object|null>} - Gig with user info
   */
  async getGigById(id) {
    return cacheService.wrap(
      `gig:id:${id}`,
      600, // 10 minutes
      () => prisma.gig.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, avatarId: true, avatarUrl: true },
          },
        },
      })
    );
  }

  /**
   * Delete a gig (only if owned by userId)
   * @param {number} gigId - Gig ID
   * @param {number} userId - User ID (must own the gig)
   * @returns {Promise<{ deleted: true }|null>} - { deleted: true } if deleted, null if not found or not owner
   */
  async deleteGig(gigId, userId) {
    const gig = await prisma.gig.findFirst({
      where: { id: gigId, userId },
      select: { id: true, state: true, district: true, pincode: true },
    });
    if (!gig) return null;

    await prisma.gig.delete({ where: { id: gigId } });

    await cacheService.del(`gigs:user:${userId}`);
    await cacheService.del(`gig:id:${gigId}`);
    if (gig.state || gig.district || gig.pincode) {
      const state = gig.state || 'all';
      const district = gig.district || 'all';
      const pincode = gig.pincode || 'all';
      await cacheService.del(`gigs:location:${state}:${district}:${pincode}`);
      if (gig.state && gig.district) await cacheService.del(`gigs:location:${gig.state}:${gig.district}:all`);
      if (gig.state) await cacheService.del(`gigs:location:${gig.state}:all:all`);
    }

    return { deleted: true };
  }
}

export const gigService = new GigService();
