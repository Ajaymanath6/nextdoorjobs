import { prisma } from '../prisma';
import { cacheService } from './cache.service';

/**
 * JobService - Business logic for job titles, colleges, and job positions
 * 
 * Handles job-related operations with caching for static data.
 */
class JobService {
  /**
   * Get all job titles with optional search
   * @param {string} query - Optional search query
   * @returns {Promise<Array>} - Job titles (cached 1 hour)
   */
  async getAllJobTitles(query = null) {
    const allJobTitles = await cacheService.wrap(
      'jobtitles:all',
      3600, // 1 hour
      () => {
        console.log('🔍 Fetching job titles from database...');
        return prisma.jobTitle.findMany({
          select: {
            id: true,
            title: true,
            category: true,
          },
          orderBy: {
            title: 'asc',
          },
        });
      }
    );

    // Filter in-memory if query provided
    if (query && query.trim()) {
      const normalizedQuery = query.toLowerCase().trim();
      return allJobTitles.filter(job =>
        job.title.toLowerCase().includes(normalizedQuery)
      );
    }

    return allJobTitles;
  }

  /**
   * Get all colleges with optional search
   * @param {string} query - Optional search query
   * @returns {Promise<Array>} - Colleges (cached 1 hour)
   */
  async getAllColleges(query = null) {
    const allColleges = await cacheService.wrap(
      'colleges:all',
      3600, // 1 hour
      () => {
        console.log('🔍 Fetching colleges from database...');
        return prisma.college.findMany({
          select: {
            id: true,
            name: true,
            category: true,
            pincode: true,
            locality: true,
            district: true,
            latitude: true,
            longitude: true,
          },
          orderBy: {
            name: 'asc',
          },
        });
      }
    );

    // Filter in-memory if query provided
    if (query && query.trim()) {
      const normalizedQuery = query.toLowerCase().trim();
      return allColleges.filter(college =>
        college.name.toLowerCase().includes(normalizedQuery) ||
        college.category.toLowerCase().includes(normalizedQuery)
      );
    }

    return allColleges;
  }

  /**
   * Get job positions for a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} - Job positions (cached 10 min)
   */
  async getJobPositionsByCompany(companyId) {
    return cacheService.wrap(
      `jobpositions:company:${companyId}`,
      600, // 10 minutes
      () => prisma.jobPosition.findMany({
        where: { companyId },
        select: {
          id: true,
          title: true,
          category: true,
          yearsRequired: true,
          salaryMin: true,
          salaryMax: true,
          jobDescription: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  /**
   * Create a job position
   * @param {object} data - Job position data
   * @returns {Promise<object>} - Created job position
   */
  async createJobPosition(data) {
    const {
      title,
      category,
      yearsRequired,
      salaryMin,
      salaryMax,
      jobDescription,
      companyId,
    } = data;

    // Validation
    if (!title || !category || !jobDescription || !companyId) {
      throw new Error('Title, category, jobDescription, and companyId are required');
    }

    // Validate yearsRequired
    const years = yearsRequired !== undefined ? parseFloat(yearsRequired) : 0;
    if (isNaN(years) || years < 0) {
      throw new Error('yearsRequired must be a non-negative number');
    }

    // Validate salary range
    const minSalary = salaryMin !== undefined && salaryMin !== null ? parseInt(salaryMin) : null;
    const maxSalary = salaryMax !== undefined && salaryMax !== null ? parseInt(salaryMax) : null;

    if (minSalary !== null && (isNaN(minSalary) || minSalary < 0)) {
      throw new Error('salaryMin must be a non-negative integer');
    }

    if (maxSalary !== null && (isNaN(maxSalary) || maxSalary < 0)) {
      throw new Error('salaryMax must be a non-negative integer');
    }

    if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
      throw new Error('salaryMin cannot be greater than salaryMax');
    }

    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Create job position
    const jobPosition = await prisma.jobPosition.create({
      data: {
        title: title.toString(),
        category,
        yearsRequired: years,
        salaryMin: minSalary,
        salaryMax: maxSalary,
        jobDescription: jobDescription.toString(),
        companyId: parseInt(companyId),
        isActive: true,
      },
    });

    // Invalidate company's job positions cache
    await cacheService.del(`jobpositions:company:${companyId}`);

    return jobPosition;
  }
}

export const jobService = new JobService();
