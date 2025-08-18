import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { AUDIT_ACTIONS, ENTITY_TYPES, USER_TYPES } from "./lib/constants";

// Create a new firm
export const createFirm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    createdByEmail: v.string(), // Admin email who created this firm
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if firm with this email already exists
    const existingFirm = await ctx.db
      .query("firms")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingFirm) {
      throw new Error("A firm with this email already exists");
    }

    // Create the firm
    const firmId = await ctx.db.insert("firms", {
      name: args.name,
      email: args.email,
      hasCompletedOnboarding: false, // Will be true after they set password
      createdAt: now,
      updatedAt: now,
      contactPerson: args.contactPerson,
      phone: args.phone,
      address: args.address,
    });

    // Log the creation in audit trail
    await ctx.db.insert("audit_logs", {
      action: AUDIT_ACTIONS.FIRM_CREATED,
      entityType: ENTITY_TYPES.FIRM,
      entityId: firmId,
      performedBy: args.createdByEmail,
      performedByType: USER_TYPES.ADMIN,
      details: {
        newValue: {
          name: args.name,
          email: args.email,
          contactPerson: args.contactPerson,
          phone: args.phone,
          address: args.address,
        },
      },
      timestamp: now,
    });

    return {
      firmId,
      message: "Firm created successfully",
    };
  },
});

// Get all firms for admin view
export const getAllFirms = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("firms")
      .order("desc")
      .collect();
  },
});

// Get firm by ID
export const getFirmById = query({
  args: { firmId: v.id("firms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.firmId);
  },
});

// Get firm by email
export const getFirmByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("firms")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Update firm details
export const updateFirm = mutation({
  args: {
    firmId: v.id("firms"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    updatedByEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { firmId, updatedByEmail, ...updateData } = args;
    const now = Date.now();

    // Get existing firm for audit trail
    const existingFirm = await ctx.db.get(firmId);
    if (!existingFirm) {
      throw new Error("Firm not found");
    }

    // Check if email is being changed and if new email already exists
    if (args.email && args.email !== existingFirm.email) {
      const emailExists = await ctx.db
        .query("firms")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      
      if (emailExists) {
        throw new Error("A firm with this email already exists");
      }
    }

    // Update the firm
    await ctx.db.patch(firmId, {
      ...updateData,
      updatedAt: now,
    });

    // Log the update in audit trail
    await ctx.db.insert("audit_logs", {
      action: "firm_updated",
      entityType: ENTITY_TYPES.FIRM,
      entityId: firmId,
      performedBy: updatedByEmail,
      performedByType: USER_TYPES.ADMIN,
      details: {
        oldValue: existingFirm,
        newValue: { ...existingFirm, ...updateData, updatedAt: now },
      },
      timestamp: now,
    });

    return { message: "Firm updated successfully" };
  },
});

// Complete firm onboarding (called after Clerk user creation)
export const completeFirmOnboarding = mutation({
  args: {
    firmEmail: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the firm by email
    const firm = await ctx.db
      .query("firms")
      .withIndex("by_email", (q) => q.eq("email", args.firmEmail))
      .first();

    if (!firm) {
      throw new Error("Firm not found");
    }

    // Check if firm has already completed onboarding
    if (firm.hasCompletedOnboarding) {
      throw new Error("Firm has already completed onboarding");
    }

    // Update the firm record
    await ctx.db.patch(firm._id, {
      clerkUserId: args.clerkUserId,
      hasCompletedOnboarding: true,
      updatedAt: now,
    });

    // Log the completion in audit trail
    await ctx.db.insert("audit_logs", {
      action: AUDIT_ACTIONS.FIRM_ONBOARDING_COMPLETED,
      entityType: ENTITY_TYPES.FIRM,
      entityId: firm._id,
      performedBy: args.firmEmail,
      performedByType: USER_TYPES.FIRM,
      details: {
        oldValue: { hasCompletedOnboarding: false },
        newValue: { hasCompletedOnboarding: true, clerkUserId: args.clerkUserId },
      },
      timestamp: now,
    });

    return { 
      message: "Firm onboarding completed successfully",
      firmId: firm._id,
    };
  },
});