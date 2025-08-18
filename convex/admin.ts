import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ADMIN_EMAIL, AUDIT_ACTIONS, ENTITY_TYPES, USER_TYPES } from "./lib/constants";

// Create or update admin user record
export const ensureAdminUser = mutation({
  args: {
    email: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Only allow the designated admin email
    if (args.email !== ADMIN_EMAIL) {
      throw new Error("Access denied: Not an authorized admin email");
    }

    // Check if admin user already exists
    const existing = await ctx.db
      .query("admin_users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing admin user
      await ctx.db.patch(existing._id, {
        clerkUserId: args.clerkUserId,
        updatedAt: now,
      });
      
      return existing._id;
    } else {
      // Create new admin user
      const adminId = await ctx.db.insert("admin_users", {
        email: args.email,
        clerkUserId: args.clerkUserId,
        createdAt: now,
        updatedAt: now,
      });

      // Log admin creation
      await ctx.db.insert("audit_logs", {
        action: AUDIT_ACTIONS.ADMIN_LOGIN,
        entityType: ENTITY_TYPES.ADMIN_USER,
        entityId: adminId,
        performedBy: args.email,
        performedByType: USER_TYPES.ADMIN,
        timestamp: now,
      });

      return adminId;
    }
  },
});

// Verify if user is admin
export const isAdminUser = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return args.email === ADMIN_EMAIL;
  },
});

// Get admin user by email
export const getAdminByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.email !== ADMIN_EMAIL) {
      return null;
    }

    return await ctx.db
      .query("admin_users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Log admin login
export const logAdminLogin = mutation({
  args: {
    email: v.string(),
    clerkUserId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.email !== ADMIN_EMAIL) {
      throw new Error("Access denied: Not an authorized admin email");
    }

    // Ensure admin user exists
    await ctx.db.insert("audit_logs", {
      action: AUDIT_ACTIONS.ADMIN_LOGIN,
      entityType: ENTITY_TYPES.ADMIN_USER,
      entityId: args.clerkUserId,
      performedBy: args.email,
      performedByType: USER_TYPES.ADMIN,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: Date.now(),
    });
  },
});