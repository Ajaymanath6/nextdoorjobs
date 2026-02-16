import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { userService } from './user.service';

/**
 * AuthService - Business logic for authentication
 * 
 * Handles authentication operations for both Clerk and cookie-based auth.
 * Delegates to UserService for user data caching.
 */
class AuthService {
  /**
   * Create session token for user
   * @param {number} userId - User ID
   * @returns {string} - Session token
   */
  createSessionToken(userId) {
    return `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get user from Clerk authentication
   * @param {string} userId - Clerk user ID
   * @returns {Promise<object|null>} - User object or null
   */
  async getUserFromClerk(userId) {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return null;
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress;
    
    if (!email) {
      return null;
    }

    const emailNorm = email.toLowerCase().trim();
    
    // Try to get existing user
    let user = await userService.getUserByEmail(emailNorm);

    if (!user) {
      // Create user from Clerk data
      const derivedName =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
          : (clerkUser.firstName || clerkUser.username || "").trim();
      const fallbackName = emailNorm.split("@")[0] || "User";
      const name =
        (derivedName && derivedName !== "User") ? derivedName : fallbackName;
      
      user = await userService.createUser({
        email: emailNorm,
        name,
        phone: null,
        clerkId: clerkUser.id,
        avatarUrl:
          clerkUser.imageUrl && String(clerkUser.imageUrl).trim()
            ? String(clerkUser.imageUrl).trim()
            : null,
      });
    }

    return user;
  }

  /**
   * Get user from cookie session
   * @param {string} sessionToken - Session token from cookie
   * @returns {Promise<object|null>} - User object or null
   */
  async getUserFromSession(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    // Extract user ID from session token (format: userId-timestamp-random)
    const userIdFromCookie = parseInt(sessionToken.split("-")[0]);

    if (isNaN(userIdFromCookie)) {
      return null;
    }

    // Get user from database (with caching via UserService)
    const user = await userService.getUserById(userIdFromCookie);
    
    return user;
  }

  /**
   * Get current authenticated user (Clerk or cookie-based)
   * @returns {Promise<object|null>} - User object or null
   */
  async getCurrentUser() {
    // First, try to get user from Clerk
    const { userId } = await auth();
    
    if (userId) {
      const user = await this.getUserFromClerk(userId);
      if (user) {
        return user;
      }
    }

    // Fallback to cookie-based session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return null;
    }

    const user = await this.getUserFromSession(sessionToken.value);
    return user;
  }
}

export const authService = new AuthService();
