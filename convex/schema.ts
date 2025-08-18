import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Admin users table - restricted access control
  admin_users: defineTable({
    email: v.string(),
    clerkUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_clerk_user_id", ["clerkUserId"]),

  // Firms table - store firm details and onboarding status
  firms: defineTable({
    name: v.string(),
    email: v.string(),
    clerkUserId: v.optional(v.string()), // Set after password creation
    hasCompletedOnboarding: v.optional(v.boolean()), // false until password is set
    status: v.optional(v.string()), // backward compatibility with existing data
    createdAt: v.number(),
    updatedAt: v.number(),
    // Additional firm details
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_onboarding_status", ["hasCompletedOnboarding"]),

  // Single-use tokens for firm onboarding
  tokens: defineTable({
    token: v.string(),
    firmId: v.id("firms"),
    isUsed: v.boolean(),
    expiresAt: v.number(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_firm_id", ["firmId"])
    .index("by_expiration", ["expiresAt"])
    .index("by_used_status", ["isUsed"]),

  // Clients table - username/password pairs managed by firms
  clients: defineTable({
    firmId: v.id("firms"), // Reference to the firm that owns this client
    username: v.string(),
    passwordHash: v.string(), // Hashed password for security
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    // Additional client metadata
    notes: v.optional(v.string()),
  })
    .index("by_firm_id", ["firmId"])
    .index("by_username", ["username"])
    .index("by_firm_and_username", ["firmId", "username"]) // Ensure unique username per firm
    .index("by_active_status", ["isActive"])
    .index("by_firm_and_active", ["firmId", "isActive"]),

  // Client sessions for authentication tracking
  client_sessions: defineTable({
    clientId: v.id("clients"),
    firmId: v.id("firms"),
    sessionToken: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastAccessedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_session_token", ["sessionToken"])
    .index("by_client_id", ["clientId"])
    .index("by_firm_id", ["firmId"])
    .index("by_expiration", ["expiresAt"]),

  // Audit log for tracking important actions
  audit_logs: defineTable({
    action: v.string(), // e.g., "firm_created", "client_login", "token_used"
    entityType: v.string(), // e.g., "firm", "client", "token"
    entityId: v.string(),
    performedBy: v.string(), // email or identifier
    performedByType: v.string(), // "admin", "firm", "client"
    details: v.optional(v.object({
      // Flexible object for additional context
      oldValue: v.optional(v.any()),
      newValue: v.optional(v.any()),
      metadata: v.optional(v.any()),
    })),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_action", ["action"])
    .index("by_entity_type", ["entityType"])
    .index("by_entity_id", ["entityId"])
    .index("by_performed_by", ["performedBy"])
    .index("by_timestamp", ["timestamp"])
    .index("by_entity_and_action", ["entityType", "action"]),
});