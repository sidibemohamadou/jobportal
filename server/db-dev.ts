import { config } from "dotenv";
config({ path: "./.env" });

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Create SQLite database for development
const sqlite = new Database('./dev-database.sqlite');

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export { sqlite as pool };

// Auto-create tables on first run
try {
  // Simple table creation for basic functionality
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      email TEXT UNIQUE,
      password TEXT,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      phone TEXT,
      role TEXT DEFAULT 'candidate',
      gender TEXT,
      marital_status TEXT,
      address TEXT,
      residence_place TEXT,
      id_document_type TEXT,
      id_document_number TEXT,
      birth_date TEXT,
      birth_place TEXT,
      birth_country TEXT,
      nationality TEXT,
      profile_completed BOOLEAN DEFAULT FALSE,
      employee_id TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      salary TEXT,
      contract_type TEXT NOT NULL,
      experience_level TEXT,
      skills TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      status TEXT DEFAULT 'pending',
      cover_letter TEXT,
      cv_path TEXT,
      motivation_letter_path TEXT,
      diploma_path TEXT,
      availability TEXT,
      salary_expectation TEXT,
      phone TEXT,
      assigned_recruiter TEXT REFERENCES users(id),
      auto_score INTEGER DEFAULT 0,
      manual_score INTEGER,
      score_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log("SQLite development database initialized");
} catch (error) {
  console.error("Error initializing SQLite database:", error);
}