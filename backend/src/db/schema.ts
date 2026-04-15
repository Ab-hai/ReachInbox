import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

// Email status enum
export const emailStatusEnum = pgEnum("email_status", [
  "scheduled",
  "processing",
  "sent",
  "failed",
]);

// Users table (for Google OAuth)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Emails table
export const emails = pgTable("emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  status: emailStatusEnum("status").default("scheduled").notNull(),
  jobId: text("job_id"), // BullMQ job ID for idempotency
  batchId: uuid("batch_id").notNull(), // Groups emails from same schedule request
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rate limit counters (Redis-backed, but DB fallback)
export const rateLimitCounters = pgTable("rate_limit_counters", {
  id: uuid("id").defaultRandom().primaryKey(),
  windowKey: text("window_key").notNull().unique(), // e.g., "2024-01-13:14"
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
