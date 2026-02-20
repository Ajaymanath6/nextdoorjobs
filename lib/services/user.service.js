import { prisma } from '../prisma';
import { cacheService } from './cache.service';

/**
 * UserService - Business logic for user operations
 * 
 * Handles user CRUD operations with caching and cache invalidation.
 */
class UserService {
  /**
   * Get user by ID
   * @param {number} id - User ID
   * @param {object} options - Query options (select fields)
   * @returns {Promise<object|null>} - User object or null
   */
  async getUserById(id, options = {}) {
    const cacheKey = `user:id:${id}`;
    const select = options.select || {
      id: true,
      email: true,
      name: true,
      phone: true,
      phoneVisibleToRecruiters: true,
      avatarUrl: true,
      avatarId: true,
      accountType: true,
      isJobSeeker: true,
      homeLatitude: true,
      homeLongitude: true,
      homeLocality: true,
      homeDistrict: true,
      homeState: true,
      createdAt: true,
    };
    
    return cacheService.wrap(
      cacheKey,
      900, // 15 minutes
      () => prisma.user.findUnique({
        where: { id },
        select,
      })
    );
  }

  /**
   * Get user by email
   * @param {string} email - User email (will be normalized)
   * @param {object} options - Query options (select fields)
   * @returns {Promise<object|null>} - User object or null
   */
  async getUserByEmail(email, options = {}) {
    const emailNorm = email.toLowerCase().trim();
    const cacheKey = `user:email:${emailNorm}`;
    const select = options.select || {
      id: true,
      email: true,
      name: true,
      phone: true,
      phoneVisibleToRecruiters: true,
      avatarUrl: true,
      avatarId: true,
      accountType: true,
      isJobSeeker: true,
      homeLatitude: true,
      homeLongitude: true,
      homeLocality: true,
      homeDistrict: true,
      homeState: true,
      createdAt: true,
    };
    
    return cacheService.wrap(
      cacheKey,
      900, // 15 minutes
      () => prisma.user.findUnique({
        where: { email: emailNorm },
        select,
      })
    );
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {object} data - Update data (name, accountType, etc.)
   * @returns {Promise<object>} - Updated user
   */
  async updateUser(id, data) {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        phoneVisibleToRecruiters: true,
        avatarUrl: true,
        avatarId: true,
        accountType: true,
        isJobSeeker: true,
        homeLatitude: true,
        homeLongitude: true,
        homeLocality: true,
        homeDistrict: true,
        homeState: true,
        createdAt: true,
      },
    });

    // Invalidate user caches
    await cacheService.del(`user:id:${id}`);
    if (updated.email) {
      await cacheService.del(`user:email:${updated.email.toLowerCase().trim()}`);
    }
    
    return updated;
  }

  /**
   * Update user avatar
   * @param {number} id - User ID
   * @param {string} avatarId - Avatar ID
   * @param {string} avatarUrl - Avatar URL
   * @returns {Promise<object>} - Updated user
   */
  async updateAvatar(id, avatarId, avatarUrl) {
    const updated = await prisma.user.update({
      where: { id },
      data: { avatarId, avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        avatarId: true,
        accountType: true,
        createdAt: true,
      },
    });

    // Invalidate user caches
    await cacheService.del(`user:id:${id}`);
    if (updated.email) {
      await cacheService.del(`user:email:${updated.email.toLowerCase().trim()}`);
    }
    
    return updated;
  }

  /**
   * Create a new user
   * @param {object} data - User data
   * @returns {Promise<object>} - Created user
   */
  async createUser(data) {
    const user = await prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        avatarId: true,
        accountType: true,
        createdAt: true,
      },
    });
    
    return user;
  }
}

export const userService = new UserService();
