import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/getCurrentUser";
import { userService } from "../../../lib/services/user.service";
import { isValidAccountType } from "../../../lib/constants/accountTypes";

const NAME_MAX_LENGTH = 255;

/**
 * GET /api/profile
 * Get current user profile.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Use service layer with caching
    const fullUser = await userService.getUserById(user.id);

    if (!fullUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: fullUser,
    });
  } catch (error) {
    console.error("Error in profile GET:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update current user profile (e.g. display name, account type, home location).
 * Body: { name?: string, accountType?: "Company" | "Individual", homeLatitude?: number, homeLongitude?: number, homeLocality?: string, homeDistrict?: string, homeState?: string }
 */
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      name: rawName,
      accountType: rawAccountType,
      homeLatitude: rawHomeLatitude,
      homeLongitude: rawHomeLongitude,
      homeLocality: rawHomeLocality,
      homeDistrict: rawHomeDistrict,
      homeState: rawHomeState,
    } = body;

    const hasUpdate =
      rawName !== undefined ||
      rawAccountType !== undefined ||
      rawHomeLatitude !== undefined ||
      rawHomeLongitude !== undefined ||
      rawHomeLocality !== undefined ||
      rawHomeDistrict !== undefined ||
      rawHomeState !== undefined;

    if (!hasUpdate) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (rawName !== undefined) {
      const name =
        typeof rawName === "string"
          ? rawName.trim().slice(0, NAME_MAX_LENGTH)
          : "";
      // Get current user name from database if name is empty
      if (!name) {
        const currentUser = await userService.getUserById(user.id, { select: { name: true } });
        updateData.name = currentUser?.name || "";
      } else {
        updateData.name = name;
      }
    }
    if (rawAccountType !== undefined) {
      const accountType =
        typeof rawAccountType === "string" ? rawAccountType.trim() : "";
      if (!isValidAccountType(accountType)) {
        return NextResponse.json(
          { error: "Invalid accountType" },
          { status: 400 }
        );
      }
      updateData.accountType = accountType;
    }

    if (rawHomeLatitude !== undefined) {
      const val = typeof rawHomeLatitude === "number" ? rawHomeLatitude : parseFloat(rawHomeLatitude);
      updateData.homeLatitude = Number.isFinite(val) ? val : null;
    }
    if (rawHomeLongitude !== undefined) {
      const val = typeof rawHomeLongitude === "number" ? rawHomeLongitude : parseFloat(rawHomeLongitude);
      updateData.homeLongitude = Number.isFinite(val) ? val : null;
    }
    if (rawHomeLocality !== undefined) {
      updateData.homeLocality = typeof rawHomeLocality === "string" ? rawHomeLocality.trim().slice(0, 255) || null : null;
    }
    if (rawHomeDistrict !== undefined) {
      updateData.homeDistrict = typeof rawHomeDistrict === "string" ? rawHomeDistrict.trim().slice(0, 100) || null : null;
    }
    if (rawHomeState !== undefined) {
      updateData.homeState = typeof rawHomeState === "string" ? rawHomeState.trim().slice(0, 100) || null : null;
    }

    // Use service layer with cache invalidation
    const updated = await userService.updateUser(user.id, updateData);

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("Error in profile PATCH:", error);
    // Log more details in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      });
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" 
            ? `${error.message}${error.code ? ` (code: ${error.code})` : ""}`
            : undefined,
      },
      { status: 500 }
    );
  }
}
