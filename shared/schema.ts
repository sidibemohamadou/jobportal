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
  boolean,
  decimal,
  date,
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
  
  // Informations personnelles détaillées
  gender: text("gender"), // Homme, Femme, Autre
  maritalStatus: text("marital_status"), // Célibataire, Marié(e), Divorcé(e), Veuf(ve)
  address: text("address"),
  residencePlace: varchar("residence_place"),
  
  // Pièce d'identité
  idDocumentType: text("id_document_type"), // CNI, Passeport, Permis de séjour
  idDocumentNumber: varchar("id_document_number"),
  
  // Informations de naissance
  birthDate: timestamp("birth_date"),
  birthPlace: varchar("birth_place"),
  birthCountry: varchar("birth_country"),
  nationality: varchar("nationality"),
  
  // Profil complété
  profileCompleted: boolean("profile_completed").default(false),
  
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
  diplomaPath: text("diploma_path"), // Chemin vers la copie du diplôme
  availability: timestamp("availability_date"),
  salaryExpectation: text("salary_expectation"),
  phone: varchar("phone"),
  assignedRecruiter: varchar("assigned_recruiter").references(() => users.id), // Recruteur assigné
  autoScore: integer("auto_score").default(0), // Score automatique (0-100)
  manualScore: integer("manual_score"), // Note manuelle du recruteur (0-100)
  scoreNotes: text("score_notes"), // Commentaires du recruteur
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table - pour les candidats devenus employés
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  employeeNumber: varchar("employee_number").notNull().unique(),
  department: text("department"),
  position: text("position").notNull(),
  manager: varchar("manager_id").references(() => users.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"), // active, inactive, terminated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contracts table - gestion des contrats
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  applicationId: integer("application_id").references(() => applications.id),
  contractType: text("contract_type").notNull(), // CDI, CDD, Stage, Freelance
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  trialPeriodEnd: date("trial_period_end"),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("EUR"),
  workingHours: integer("working_hours").default(35), // heures par semaine
  vacationDays: integer("vacation_days").default(25), // jours de congés annuels
  signatureStatus: text("signature_status").default("pending"), // pending, signed, rejected
  signedAt: timestamp("signed_at"),
  contractPath: text("contract_path"), // chemin vers le PDF du contrat
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft, active, terminated, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract amendments table - avenants
export const contractAmendments = pgTable("contract_amendments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  amendmentType: text("amendment_type").notNull(), // salary_change, role_change, schedule_change, etc.
  description: text("description").notNull(),
  effectiveDate: date("effective_date").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value").notNull(),
  signatureStatus: text("signature_status").default("pending"),
  signedAt: timestamp("signed_at"),
  documentPath: text("document_path"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll table - gestion des salaires
export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  period: text("period").notNull(), // YYYY-MM format
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  bonuses: decimal("bonuses", { precision: 10, scale: 2 }).default("0"),
  overtime: decimal("overtime", { precision: 10, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  socialCharges: decimal("social_charges", { precision: 10, scale: 2 }).default("0"),
  taxes: decimal("taxes", { precision: 10, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  workingDays: integer("working_days").default(22),
  absenceDays: integer("absence_days").default(0),
  status: text("status").default("draft"), // draft, validated, paid
  paymentDate: date("payment_date"),
  payslipPath: text("payslip_path"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave requests table - demandes de congés
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  leaveType: text("leave_type").notNull(), // vacation, sick, personal, maternity, etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: text("status").default("pending"), // pending, approved, rejected, cancelled
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  substituteCoverage: varchar("substitute_coverage").references(() => users.id),
  emergencyContact: text("emergency_contact"),
  attachmentPath: text("attachment_path"), // certificat médical, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave balances table - soldes de congés
export const leaveBalances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  year: integer("year").notNull(),
  leaveType: text("leave_type").notNull(),
  totalDays: integer("total_days").notNull(),
  usedDays: integer("used_days").default(0),
  remainingDays: integer("remaining_days").notNull(),
  carriedOverDays: integer("carried_over_days").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR requests table - demandes internes RH
export const hrRequests = pgTable("hr_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  requestType: text("request_type").notNull(), // address_change, equipment, certificate, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  status: text("status").default("pending"), // pending, in_progress, completed, rejected
  assignedTo: varchar("assigned_to").references(() => users.id),
  attachmentPath: text("attachment_path"),
  responseNotes: text("response_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export schemas for validation
export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAmendmentSchema = createInsertSchema(contractAmendments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayrollSchema = createInsertSchema(payroll).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHrRequestSchema = createInsertSchema(hrRequests).omit({
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

// New HR module types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ContractAmendment = typeof contractAmendments.$inferSelect;
export type InsertAmendment = z.infer<typeof insertAmendmentSchema>;
export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type HrRequest = typeof hrRequests.$inferSelect;
export type InsertHrRequest = z.infer<typeof insertHrRequestSchema>;
