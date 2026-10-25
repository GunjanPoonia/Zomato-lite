// db/setup.mjs — applies db/schema.sql and seeds one restaurant + three reviews.
// Safe to re-run: existing tables are never dropped, and the seed only inserts when empty.
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

// The secret never leaves .env.local — we read it at runtime, we never paste it here.
const envFile = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const urlLine = envFile.split("\n").find((line) => line.startsWith("DATABASE_URL="));
if (!urlLine) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}
const DATABASE_URL = urlLine.replace("DATABASE_URL=", "").trim();

const sql = neon(DATABASE_URL);

// 1. Apply the schema only if the tables don't exist yet (idempotent = safe to re-run).
const tableExists = await sql`
  SELECT
    to_regclass('public.restaurants') IS NOT NULL AS restaurants,
    to_regclass('public.reviews')     IS NOT NULL AS reviews
`;
if (!tableExists[0].restaurants || !tableExists[0].reviews) {
  const schema = await readFile(new URL("schema.sql", import.meta.url), "utf8");
  // Neon's HTTP protocol sends one statement per request — split the file at ';'.
  for (const statement of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await sql.query(statement);
  }
  console.log("✅ Schema applied (2 tables created)");
} else {
  console.log("↩️  Tables already exist — schema skipped, nothing dropped");
}

// 2. Seed the restaurant (INSERT ... DO NOTHING → same: no duplicates on re-run).
const restaurantId = await sql`
  INSERT INTO restaurants (id, name, cuisine, area)
  VALUES (1, 'Ludhiana Burrito', 'Indian', 'Sector 32')
  ON CONFLICT (id) DO NOTHING
  RETURNING id
`;
if (restaurantId.length > 0) {
  console.log(`✅ Seeded restaurant ${restaurantId[0].id}: Ludhiana Burrito`);
} else {
  console.log("↩️  Restaurant already exists seed skipped");
}

// 3. Seed three reviews, days apart, so 'latest review' is meaningful.
const reviewCount = await sql`SELECT COUNT(*)::int AS count FROM reviews WHERE restaurant_id = 1`;
if (reviewCount[0].count === 0) {
  const created = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment, created_at)
    VALUES
      (1, 5, 'Paneer burrito is unreal',  now() - interval '8 days'),
      (1, 4, 'Good, but slow service',    now() - interval '6 days'),
      (1, 4, 'Solid. Would repeat.',      now() - interval '2 days')
    RETURNING id
  `;
  console.log(`✅ Seeded ${created.length} reviews`);
} else {
  console.log(`↩️  Reviews already exist (${reviewCount[0].count}) — seed skipped`);
}

// 4. Show the rows we now have, like a cold-storage inventory.
const restaurants = await sql`SELECT id, name, cuisine, area FROM restaurants ORDER BY id`;
const reviews =
  await sql`SELECT id, restaurant_id, rating, left(comment, 40) AS comment, created_at FROM reviews ORDER BY id`;

console.log("\n--- restaurants ---");
console.table(restaurants);
console.log("--- reviews ---");
console.table(reviews);
