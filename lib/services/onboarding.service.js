import { prisma } from '../prisma';
import { userService } from './user.service';
import bcrypt from 'bcryptjs';

/**
 * OnboardingService - Business logic for user onboarding
 * 
 * Handles user creation, updates, and validation during onboarding flow.
 * Delegates to UserService for caching.
 */
class OnboardingService {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} - { valid: boolean, error?: string }
   */
  validatePassword(password) {
    if (!password) {
      return { valid: true }; // Password is optional
    }
    if (password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Create session token for user
   * @param {number} userId - User ID
   * @returns {string} - Session token
   */
  createSessionToken(userId) {
    return `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Create or update user during onboarding
   * @param {object} data - User data { email, name, password?, phone?, clerkId?, avatarUrl? }
   * @returns {Promise<object>} - { user, isNew: boolean, sessionToken?: string }
   */
  async createOrUpdateUser(data) {
    const { email, name, password, phone, clerkId, avatarUrl } = data;

    // Validate email
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password if provided
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    const emailNorm = email.toLowerCase().trim();

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    if (user) {
      // User exists - update if needed
      const updateData = {};
      if (name !== user.name) {
        updateData.name = name;
      }
      if (phone !== user.phone) {
        updateData.phone = phone || null;
      }
      if (clerkId !== undefined && clerkId !== user.clerkId) {
        updateData.clerkId = clerkId || null;
      }
      if (avatarUrl !== undefined && avatarUrl !== user.avatarUrl) {
        updateData.avatarUrl = avatarUrl || null;
      }
      // Update password if provided
      if (password) {
        updateData.passwordHash = await this.hashPassword(password);
      }

      // Update user if there are changes
      if (Object.keys(updateData).length > 0) {
        user = await userService.updateUser(user.id, updateData);
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
        isNew: false,
      };
    }

    // Create new user
    const userData = {
      email: emailNorm,
      name,
      phone: phone || null,
      clerkId: clerkId && String(clerkId).trim() ? String(clerkId).trim() : null,
      avatarUrl: avatarUrl && String(avatarUrl).trim() ? String(avatarUrl).trim() : null,
    };

    // Hash password if provided
    if (password) {
      userData.passwordHash = await this.hashPassword(password);
    }

    user = await userService.createUser(userData);

    const result = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
      isNew: true,
    };

    // Create session token if password was provided
    if (password) {
      result.sessionToken = this.createSessionToken(user.id);
    }

    return result;
  }

  /**
   * Get user by email with optional Clerk linkage update
   * @param {string} email - User email
   * @param {object} options - { clerkId?, avatarUrl? }
   * @returns {Promise<object|null>} - User object or null
   */
  async getUserByEmail(email, options = {}) {
    const emailNorm = email.toLowerCase().trim();
    
    let user = await userService.getUserByEmail(emailNorm, {
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });

    if (!user) {
      return null;
    }

    // Optionally update Clerk linkage (best-effort)
    const { clerkId, avatarUrl } = options;
    const clerkIdStr = clerkId != null && String(clerkId).trim() ? String(clerkId).trim() : null;
    const avatarUrlStr = avatarUrl != null && String(avatarUrl).trim() ? String(avatarUrl).trim() : null;
    
    if (clerkIdStr || avatarUrlStr) {
      try {
        const updateData = {};
        if (clerkIdStr) updateData.clerkId = clerkIdStr;
        if (avatarUrlStr) updateData.avatarUrl = avatarUrlStr;
        
        if (Object.keys(updateData).length > 0) {
          await userService.updateUser(user.id, updateData);
        }
      } catch (updateErr) {
        console.error('Error updating Clerk linkage:', updateErr);
        // Don't fail the request if Clerk update fails
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    };
  }
}

export const onboardingService = new OnboardingService();
