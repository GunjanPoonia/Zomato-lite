// app/api/reviews/route.ts — IS the endpoint POST /api/reviews.
// Saves one review. Validates before trusting anything (the frontend is "one polite visitor").
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Check 1: rating is a whole number from 1 to 5
  const rating = body?.rating;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be a whole number from 1 to 5" }, { status: 400 });
  }

  // Check 2: comment is a non-empty string after trimming whitespace
  const comment = body?.comment;
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json({ error: "comment cannot be empty" }, { status: 400 });
  }

  // Check 3: restaurantId refers to a restaurant that actually exists (a database lookup)
  const restaurantId = body?.restaurantId;
  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "restaurantId must be a whole number" }, { status: 400 });
  }
  const found = await sql`SELECT id FROM restaurants WHERE id = ${restaurantId}`;
  if (!found[0]) {
    return NextResponse.json({ error: "this restaurant does not exist" }, { status: 400 });
  }

  // All checks passed: write exactly one fact and step back.
  // The DB's CHECK constraint re-verifies the rating independently — never remove it.
  const inserted = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment)
    VALUES (${restaurantId}, ${rating}, ${comment.trim()})
    RETURNING id
  `;
  return NextResponse.json({ success: true, reviewId: inserted[0].id }, { status: 201 });
}
