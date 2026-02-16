import { prisma } from '../prisma';
import { cacheService } from './cache.service';

/**
 * CompanyService - Business logic for company operations
 * 
 * Handles company CRUD operations with caching.
 */
class CompanyService {
  /**
   * Get company by ID
   * @param {number} id - Company ID
   * @returns {Promise<object|null>} - Company object (cached 15 min)
   */
  async getCompanyById(id) {
    return cacheService.wrap(
      `company:id:${id}`,
      900, // 15 minutes
      () => prisma.company.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          logoPath: true,
          websiteUrl: true,
          fundingSeries: true,
          latitude: true,
          longitude: true,
          state: true,
          district: true,
          pincode: true,
          userId: true,
          createdAt: true,
        },
      })
    );
  }

  /**
   * Get all companies for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User's companies (cached 10 min)
   */
  async getCompaniesByUser(userId) {
    return cacheService.wrap(
      `companies:user:${userId}`,
      600, // 10 minutes
      () => prisma.company.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          logoPath: true,
          websiteUrl: true,
          fundingSeries: true,
          latitude: true,
          longitude: true,
          state: true,
          district: true,
          pincode: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  /**
   * Find company by user and name (for idempotent creation)
   * @param {number} userId - User ID
   * @param {string} name - Company name
   * @returns {Promise<object|null>} - Company object or null
   */
  async findCompanyByUserAndName(userId, name) {
    return prisma.company.findFirst({
      where: { 
        userId, 
        name: name.trim(),
      },
    });
  }

  /**
   * Create a new company
   * @param {number} userId - User ID
   * @param {object} data - Company data
   * @returns {Promise<object>} - Created company
   */
  async createCompany(userId, data) {
    const {
      name,
      logoPath,
      websiteUrl,
      fundingSeries,
      latitude,
      longitude,
      state,
      district,
      pincode,
    } = data;

    // Validate required fields
    if (!name || !state || !district) {
      throw new Error('Name, state, and district are required');
    }

    // Validate coordinates if provided
    if (latitude !== null && latitude !== undefined) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('Invalid latitude. Must be between -90 and 90');
      }
    }
    if (longitude !== null && longitude !== undefined) {
      const lon = parseFloat(longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        throw new Error('Invalid longitude. Must be between -180 and 180');
      }
    }

    // Validate funding series if provided
    const validFundingSeries = [
      'Seed',
      'SeriesA',
      'SeriesB',
      'SeriesC',
      'SeriesD',
      'SeriesE',
      'IPO',
      'Bootstrapped',
    ];
    const fundingSeriesValue =
      fundingSeries && validFundingSeries.includes(fundingSeries)
        ? fundingSeries
        : null;

    // Validate website URL if provided
    let websiteUrlValue = null;
    if (websiteUrl && websiteUrl.toString().trim()) {
      const urlString = websiteUrl.toString().trim();
      try {
        // Add protocol if missing
        const urlWithProtocol = urlString.startsWith('http://') || urlString.startsWith('https://')
          ? urlString
          : `https://${urlString}`;
        new URL(urlWithProtocol);
        websiteUrlValue = urlWithProtocol;
      } catch (urlError) {
        throw new Error('Invalid website URL format');
      }
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        name: name.toString().trim(),
        logoPath: logoPath || null,
        websiteUrl: websiteUrlValue,
        fundingSeries: fundingSeriesValue,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        state: state.toString(),
        district: district.toString(),
        pincode: pincode ? pincode.toString() : null,
        userId,
      },
    });

    // Invalidate user's companies cache
    await cacheService.del(`companies:user:${userId}`);

    return company;
  }

  /**
   * Update company
   * @param {number} id - Company ID
   * @param {object} data - Update data
   * @returns {Promise<object>} - Updated company
   */
  async updateCompany(id, data) {
    const company = await prisma.company.update({
      where: { id },
      data,
    });

    // Invalidate caches
    await cacheService.del(`company:id:${id}`);
    await cacheService.del(`companies:user:${company.userId}`);

    return company;
  }
}

export const companyService = new CompanyService();
