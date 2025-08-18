// Authentication and authorization constants

export const ADMIN_EMAIL = "harrisonyenwe@gmail.com";

export const TOKEN_EXPIRY_HOURS = 24; // Tokens expire after 24 hours
export const CLIENT_SESSION_EXPIRY_HOURS = 24 * 7; // Client sessions expire after 7 days

// Audit log action types
export const AUDIT_ACTIONS = {
  FIRM_CREATED: "firm_created",
  FIRM_ONBOARDING_COMPLETED: "firm_onboarding_completed",
  TOKEN_GENERATED: "token_generated",
  TOKEN_USED: "token_used",
  CLIENT_CREATED: "client_created",
  CLIENT_UPDATED: "client_updated",
  CLIENT_LOGIN: "client_login",
  CLIENT_LOGOUT: "client_logout",
  ADMIN_LOGIN: "admin_login",
} as const;

// Entity types for audit logging
export const ENTITY_TYPES = {
  FIRM: "firm",
  CLIENT: "client",
  TOKEN: "token",
  ADMIN_USER: "admin_user",
} as const;

// User types for audit logging
export const USER_TYPES = {
  ADMIN: "admin",
  FIRM: "firm",
  CLIENT: "client",
} as const;