import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  role: text("role").default("candidate"), // candidate, recruiter, hr, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job postings table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  salary: text("salary"),
  contractType: text("contract_type").notNull(), // CDI, CDD, Freelance
  experienceLevel: text("experience_level"), // Débutant, Intermédiaire, Senior
  skills: text("skills").array(),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Applications table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  status: text("status").notNull().default("pending"), // pending, reviewed, interview, accepted, rejected
  coverLetter: text("cover_letter"),
  cvPath: text("cv_path"),
  motivationLetterPath: text("motivation_letter_path"),
  availabilityDate: timestamp("availability_date"),
  salaryExpectation: text("salary_expectation"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export schemas for validation
export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateApplicationSchema = insertApplicationSchema.partial();

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;
