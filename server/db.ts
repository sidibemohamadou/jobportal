import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuration pour utiliser la base de données de développement en production
// NOTE: Ceci fait pointer la production vers la même DB que le développement
const DATABASE_URL = process.env.DATABASE_URL;
console.log(`Using database: ${DATABASE_URL.substring(0, 50)}...`);

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });