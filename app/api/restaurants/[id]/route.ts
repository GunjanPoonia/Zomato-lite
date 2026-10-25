// app/api/restaurants/[id]/route.ts — IS the endpoint GET /api/restaurants/1.
// Loads the restaurant page's data: facts + answers computed FRESH, at request time.
// The three lines of intelligence of this product:
//   averageRating -> AVG(rating)          (rounded to 1 decimal, HERE in the backend)
//   totalReviews  -> COUNT(*)
//   latestReview  -> ORDER BY created_at DESC LIMIT 1
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

function toReview(row: { id: number; rating: number; comment: string; created_at: string }) {
  return { id: row.id, rating: row.rating, comment: row.comment, createdAt: new Date(row.created_at).toISOString() };
}

// The shapes we promise the database will return — TypeScript checks that we keep the promise
type RestaurantRow = { name: string; cuisine: string; area: string };
type ReviewRow = { id: number; rating: number; comment: string; created_at: string };
type StatsRow = { average_rating: number | string | null; total_reviews: number };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const restaurantId = Number((await params).id);
  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "restaurant not found" }, { status: 404 });
  }

  // Does the restaurant exist? If not: 404.
  const found = (await sql`
    SELECT name, cuisine, area FROM restaurants WHERE id = ${restaurantId}
  `) as RestaurantRow[];
  if (!found[0]) {
    return NextResponse.json({ error: "restaurant not found" }, { status: 404 });
  }
  const { name, cuisine, area } = found[0];

  // The answers, computed right now by the DATABASE (not stored anywhere, not done by any screen).
  const stats = (await sql`
    SELECT
      ROUND(AVG(rating)::numeric, 1)  AS average_rating,
      COUNT(*)::int                   AS total_reviews
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
  `) as StatsRow[];

  // Newest review first; `id DESC` breaks ties so two reviews in the same millisecond can't flip-flop.
  const latestRow = (await sql`
    SELECT id, rating, comment, created_at
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `) as ReviewRow[];
  // Every review except the latest, newest first (the page shows the latest separately, not twice).
  const olderRows = (await sql`
    SELECT id, rating, comment, created_at
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC, id DESC
    OFFSET 1
  `) as ReviewRow[];

  return NextResponse.json({
    name,
    cuisine,
    area,
    // AVG of zero rows is NULL: a restaurant with no reviews has no average yet — a fact.
    averageRating: stats[0].average_rating === null ? null : Number(stats[0].average_rating),
    totalReviews: stats[0].total_reviews,
    latestReview: latestRow[0] ? toReview(latestRow[0]) : null,
    reviews: olderRows.map(toReview),
  });
}
