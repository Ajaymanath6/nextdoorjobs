import { prisma } from '../prisma';
import { cacheService } from './cache.service';

// Select that omits phoneVisibleToRecruiters so profile works when column is not yet migrated
const BASE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
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

const FULL_USER_SELECT = { ...BASE_USER_SELECT, phoneVisibleToRecruiters: true };

function isMissingColumnError(err) {
  const msg = err?.message && String(err.message);
  return msg && (msg.includes('phone_visible_to_recruiters') || msg.includes('column') && msg.includes('does not exist'));
}

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
    const select = options.select || FULL_USER_SELECT;
    
    return cacheService.wrap(
      cacheKey,
      900, // 15 minutes
      async () => {
        try {
          return await prisma.user.findUnique({
            where: { id },
            select,
          });
        } catch (err) {
          if (isMissingColumnError(err) && select.phoneVisibleToRecruiters) {
            return await prisma.user.findUnique({
              where: { id },
              select: BASE_USER_SELECT,
            });
          }
          throw err;
        }
      }
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
    const select = options.select || FULL_USER_SELECT;
    
    return cacheService.wrap(
      cacheKey,
      900, // 15 minutes
      async () => {
        try {
          return await prisma.user.findUnique({
            where: { email: emailNorm },
            select,
          });
        } catch (err) {
          if (isMissingColumnError(err) && select.phoneVisibleToRecruiters) {
            return await prisma.user.findUnique({
              where: { email: emailNorm },
              select: BASE_USER_SELECT,
            });
          }
          throw err;
        }
      }
    );
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {object} data - Update data (name, accountType, etc.)
   * @returns {Promise<object>} - Updated user
   */
  async updateUser(id, data) {
    const select = { ...FULL_USER_SELECT };
    try {
      const updated = await prisma.user.update({
        where: { id },
        data,
        select,
      });
      await cacheService.del(`user:id:${id}`);
      if (updated.email) {
        await cacheService.del(`user:email:${updated.email.toLowerCase().trim()}`);
      }
      return updated;
    } catch (err) {
      if (isMissingColumnError(err) && data.phoneVisibleToRecruiters !== undefined) {
        const { phoneVisibleToRecruiters, ...dataWithout } = data;
        const updated = await prisma.user.update({
          where: { id },
          data: dataWithout,
          select: BASE_USER_SELECT,
        });
        await cacheService.del(`user:id:${id}`);
        if (updated.email) {
          await cacheService.del(`user:email:${updated.email.toLowerCase().trim()}`);
        }
        // Return without phoneVisibleToRecruiters so client keeps optimistic toggle state; value cannot be persisted until column exists
        return updated;
      }
      throw err;
    }
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
