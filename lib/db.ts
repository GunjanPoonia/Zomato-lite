// lib/db.ts — every backend file imports this one database connection.
// Next.js loads .env.local for server-side code, so the secret stays out of source files.
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL as string);
