import { prisma } from '../prisma';
import { cacheService } from './cache.service';

const MAX_NAME_LEN = 255;
const MAX_STATE_DISTRICT_LEN = 100;
const MAX_PINCODE_LEN = 10;
const MAX_URL_LEN = 500;

function truncateField(value, maxLen) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** Keep pincode within VarChar(10); prefer numeric prefix from geocoders. */
function normalizePincode(pincode) {
  if (pincode == null) return null;
  const raw = String(pincode).trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length > 0) {
    return digits.slice(0, MAX_PINCODE_LEN);
  }
  return truncateField(raw, MAX_PINCODE_LEN);
}

function formatPrismaCreateError(err) {
  const code = err?.code || '';
  const msg = String(err?.message || '');
  if (
    code === 'ETIMEDOUT' ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('connection timed out')
  ) {
    return (
      'Database connection timed out. Fix DATABASE_URL in .env.local (Neon pooled URL), ' +
      'wake your Neon project, then run: npm run db:check && npm run db:seed-admin-owner'
    );
  }
  if (err?.code === 'P2003') {
    return 'Admin owner user not found in the database. Run: npm run db:seed-admin-owner — then set ADMIN_OWNER_USER_ID (or ADMIN_OWNER_EMAIL) in .env.local to match.';
  }
  if (err?.code === 'P2000') {
    const col = err?.meta?.column_name || err?.meta?.target;
    return col
      ? `Value too long for ${col}. Shorten the company name, website, logo URL, or location fields.`
      : 'One of the company fields is too long for the database.';
  }
  return err?.message || 'Failed to create company';
}

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
          description: true,
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
          description: true,
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
      description,
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

    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!owner) {
      throw new Error(
        'Admin owner user not found in the database. Run: npm run db:seed-admin-owner — then set ADMIN_OWNER_USER_ID (or ADMIN_OWNER_EMAIL) in .env.local.'
      );
    }

    const safeName = truncateField(name, MAX_NAME_LEN);
    const safeState = truncateField(state, MAX_STATE_DISTRICT_LEN);
    const safeDistrict = truncateField(district, MAX_STATE_DISTRICT_LEN);
    const safePincode = normalizePincode(pincode);
    const safeLogoPath = truncateField(logoPath, MAX_URL_LEN);

    if (!safeName || !safeState || !safeDistrict) {
      throw new Error('Name, state, and district are required');
    }

    let company;
    try {
      company = await prisma.company.create({
        data: {
          name: safeName,
          description:
            description != null && String(description).trim()
              ? String(description).trim()
              : null,
          logoPath: safeLogoPath,
          websiteUrl: websiteUrlValue
            ? truncateField(websiteUrlValue, MAX_URL_LEN)
            : null,
          fundingSeries: fundingSeriesValue,
          latitude: (() => {
            if (latitude == null || latitude === '') return null;
            const n = parseFloat(latitude);
            return Number.isFinite(n) ? n : null;
          })(),
          longitude: (() => {
            if (longitude == null || longitude === '') return null;
            const n = parseFloat(longitude);
            return Number.isFinite(n) ? n : null;
          })(),
          state: safeState,
          district: safeDistrict,
          pincode: safePincode,
          userId,
        },
      });
    } catch (err) {
      const message = formatPrismaCreateError(err);
      throw new Error(message);
    }

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

  /**
   * Update company location
   * @param {number} id - Company ID
   * @param {object} locationData - Location data (latitude, longitude, state, district, pincode)
   * @returns {Promise<object>} - Updated company
   */
  async updateCompanyLocation(id, locationData) {
    const { latitude, longitude, state, district, pincode } = locationData;

    // Validate required fields
    if (!state || !district) {
      throw new Error('State and district are required');
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

    const updateData = {
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      state: state.toString(),
      district: district.toString(),
      pincode: pincode ? pincode.toString() : null,
    };

    return this.updateCompany(id, updateData);
  }

  /**
   * Delete company by ID
   * @param {number} id - Company ID
   * @returns {Promise<object>} - Deleted company
   */
  async deleteCompany(id) {
    const company = await prisma.company.delete({
      where: { id },
    });

    // Invalidate caches
    await cacheService.del(`company:id:${id}`);
    await cacheService.del(`companies:user:${company.userId}`);

    return company;
  }
}

export const companyService = new CompanyService();
