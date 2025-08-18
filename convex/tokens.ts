import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { AUDIT_ACTIONS, ENTITY_TYPES, USER_TYPES, TOKEN_EXPIRY_HOURS } from "./lib/constants";

// Generate a secure random token
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate onboarding token for a firm
export const generateOnboardingToken = mutation({
  args: {
    firmId: v.id("firms"),
    generatedByEmail: v.string(), // Admin email who generated this token
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000); // 24 hours from now

    // Verify the firm exists
    const firm = await ctx.db.get(args.firmId);
    if (!firm) {
      throw new Error("Firm not found");
    }

    // Check if firm already has an unused token
    const existingToken = await ctx.db
      .query("tokens")
      .withIndex("by_firm_id", (q) => q.eq("firmId", args.firmId))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .first();

    if (existingToken) {
      // Check if existing token is still valid
      if (existingToken.expiresAt > now) {
        throw new Error("This firm already has an active onboarding token");
      }
      
      // Mark expired token as used
      await ctx.db.patch(existingToken._id, {
        isUsed: true,
        usedAt: now,
      });
    }

    // Generate unique token
    let token: string;
    let isUnique = false;
    
    // Ensure token is unique (very low probability of collision, but being safe)
    while (!isUnique) {
      token = generateSecureToken();
      const existingWithSameToken = await ctx.db
        .query("tokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      
      if (!existingWithSameToken) {
        isUnique = true;
      }
    }

    // Create the token
    const tokenId = await ctx.db.insert("tokens", {
      token: token!,
      firmId: args.firmId,
      isUsed: false,
      expiresAt,
      createdAt: now,
    });

    // Log token generation in audit trail
    await ctx.db.insert("audit_logs", {
      action: AUDIT_ACTIONS.TOKEN_GENERATED,
      entityType: ENTITY_TYPES.TOKEN,
      entityId: tokenId,
      performedBy: args.generatedByEmail,
      performedByType: USER_TYPES.ADMIN,
      details: {
        metadata: {
          firmId: args.firmId,
          firmName: firm.name,
          firmEmail: firm.email,
          expiresAt,
        },
      },
      timestamp: now,
    });

    return {
      tokenId,
      token: token!,
      expiresAt,
      message: "Onboarding token generated successfully",
    };
  },
});

// Validate and get token details (for firm signup process)
export const validateToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord) {
      return { valid: false, error: "Token not found" };
    }

    if (tokenRecord.isUsed) {
      return { valid: false, error: "Token has already been used" };
    }

    if (tokenRecord.expiresAt < Date.now()) {
      return { valid: false, error: "Token has expired" };
    }

    // Get associated firm
    const firm = await ctx.db.get(tokenRecord.firmId);
    if (!firm) {
      return { valid: false, error: "Associated firm not found" };
    }

    return {
      valid: true,
      token: tokenRecord,
      firm: {
        _id: firm._id,
        name: firm.name,
        email: firm.email,
      },
    };
  },
});

// Use token (mark as used when firm completes onboarding)
export const useToken = mutation({
  args: {
    token: v.string(),
    usedByEmail: v.string(), // Firm email that used the token
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord) {
      throw new Error("Token not found");
    }

    if (tokenRecord.isUsed) {
      throw new Error("Token has already been used");
    }

    if (tokenRecord.expiresAt < Date.now()) {
      throw new Error("Token has expired");
    }

    const now = Date.now();

    // Mark token as used
    await ctx.db.patch(tokenRecord._id, {
      isUsed: true,
      usedAt: now,
    });

    // Log token usage in audit trail
    await ctx.db.insert("audit_logs", {
      action: AUDIT_ACTIONS.TOKEN_USED,
      entityType: ENTITY_TYPES.TOKEN,
      entityId: tokenRecord._id,
      performedBy: args.usedByEmail,
      performedByType: USER_TYPES.FIRM,
      details: {
        metadata: {
          firmId: tokenRecord.firmId,
          originallyCreatedAt: tokenRecord.createdAt,
        },
      },
      timestamp: now,
    });

    return { message: "Token used successfully" };
  },
});

// Get all tokens for admin view
export const getAllTokens = query({
  handler: async (ctx) => {
    const tokens = await ctx.db
      .query("tokens")
      .order("desc")
      .collect();

    // Enrich with firm data
    const enrichedTokens = await Promise.all(
      tokens.map(async (token) => {
        const firm = await ctx.db.get(token.firmId);
        return {
          ...token,
          firm,
        };
      })
    );

    return enrichedTokens;
  },
});

// Get active tokens for a specific firm
export const getActiveFirmTokens = query({
  args: { firmId: v.id("firms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tokens")
      .withIndex("by_firm_id", (q) => q.eq("firmId", args.firmId))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .collect();
  },
});

// Get all active tokens (including expired ones for admin view)
export const getAllActiveTokens = query({
  handler: async (ctx) => {
    const tokens = await ctx.db
      .query("tokens")
      .withIndex("by_used_status", (q) => q.eq("isUsed", false))
      .order("desc")
      .collect();

    // Enrich with firm data
    const enrichedTokens = await Promise.all(
      tokens.map(async (token) => {
        const firm = await ctx.db.get(token.firmId);
        return {
          ...token,
          firm,
        };
      })
    );

    return enrichedTokens;
  },
});

// Force generate a new token (invalidates existing ones)
export const forceGenerateOnboardingToken = mutation({
  args: {
    firmId: v.id("firms"),
    generatedByEmail: v.string(), // Admin email who generated this token
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000); // 24 hours from now

    // Verify the firm exists
    const firm = await ctx.db.get(args.firmId);
    if (!firm) {
      throw new Error("Firm not found");
    }

    // Mark ALL existing tokens for this firm as used (cleanup)
    const existingTokens = await ctx.db
      .query("tokens")
      .withIndex("by_firm_id", (q) => q.eq("firmId", args.firmId))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .collect();

    for (const existingToken of existingTokens) {
      await ctx.db.patch(existingToken._id, {
        isUsed: true,
        usedAt: now,
      });
    }

    // Generate unique token
    let token: string;
    let isUnique = false;
    
    while (!isUnique) {
      token = generateSecureToken();
      const existingWithSameToken = await ctx.db
        .query("tokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      
      if (!existingWithSameToken) {
        isUnique = true;
      }
    }

    // Create the new token
    const tokenId = await ctx.db.insert("tokens", {
      token: token!,
      firmId: args.firmId,
      isUsed: false,
      expiresAt,
      createdAt: now,
    });

    // Log token generation in audit trail
    await ctx.db.insert("audit_logs", {
      action: AUDIT_ACTIONS.TOKEN_GENERATED,
      entityType: ENTITY_TYPES.TOKEN,
      entityId: tokenId,
      performedBy: args.generatedByEmail,
      performedByType: USER_TYPES.ADMIN,
      details: {
        metadata: {
          firmId: args.firmId,
          firmName: firm.name,
          firmEmail: firm.email,
          expiresAt,
          forceGenerated: true,
          invalidatedTokens: existingTokens.length,
        },
      },
      timestamp: now,
    });

    return {
      tokenId,
      token: token!,
      expiresAt,
      message: `New onboarding token generated (invalidated ${existingTokens.length} existing tokens)`,
    };
  },
});

// Use token by email (for verification completion)
export const useTokenByEmail = mutation({
  args: {
    firmEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Find firm by email
    const firm = await ctx.db
      .query("firms")
      .withIndex("by_email", (q) => q.eq("email", args.firmEmail))
      .first();

    if (!firm) {
      throw new Error("Firm not found");
    }

    // Find any unused tokens for this firm
    const tokens = await ctx.db
      .query("tokens")
      .withIndex("by_firm_id", (q) => q.eq("firmId", firm._id))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .collect();

    const now = Date.now();

    // Mark all tokens as used
    for (const token of tokens) {
      await ctx.db.patch(token._id, {
        isUsed: true,
        usedAt: now,
      });

      // Log token usage
      await ctx.db.insert("audit_logs", {
        action: AUDIT_ACTIONS.TOKEN_USED,
        entityType: ENTITY_TYPES.TOKEN,
        entityId: token._id,
        performedBy: args.firmEmail,
        performedByType: USER_TYPES.FIRM,
        details: {
          metadata: {
            firmId: firm._id,
            verificationCompleted: true,
          },
        },
        timestamp: now,
      });
    }

    return { message: `Marked ${tokens.length} tokens as used for ${args.firmEmail}` };
  },
});