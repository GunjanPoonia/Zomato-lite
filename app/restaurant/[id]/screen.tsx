"use client";

// Screen 2 — Restaurant page — /restaurant/[id]
// Calls GET /api/restaurants/[id] and renders what it gets. That is the whole job.
// No adding. No dividing. No sorting. If a number changes, it is the BACKEND noticing.
import { use, useEffect, useState } from "react";
import Link from "next/link";

type Review = { id: number; rating: number; comment: string; createdAt: string };
type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

function Stars({ count }: { count: number }) {
  return (
    <span className="whitespace-nowrap text-accent">
      {"★".repeat(count)}
      <span className="text-stone-300">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function RestaurantScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<RestaurantData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not found");
        setData(await res.json());
        setStatus("ready");
      })
      .catch(() => setStatus("notfound"));
  }, [id]);

  if (status === "loading") {
    return <main className="mx-auto max-w-[560px] px-6 py-16 text-muted">Loading…</main>;
  }

  if (status === "notfound") {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-16">
        <p>This restaurant does not exist.</p>
        <Link href="/" className="text-accent">Go home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[560px] px-6 py-16 pb-32">
      {/* 0. A real burrito photo, full content width, height matched to the details block below */}
      <img
        src="/burrito.jpg"
        alt="A Ludhiana-style burrito"
        className="h-32 w-full rounded-lg object-cover"
      />

      {/* 1. Details on the left (location above cuisine), rating on the right */}
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data!.name}</h1>
          <p className="mt-1 text-sm text-muted">{data!.area}</p>
          <p className="text-sm text-muted">{data!.cuisine}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-5xl font-semibold tracking-tight text-green-700">
              {data!.averageRating ?? "—"}
            </span>
            {data!.averageRating !== null && (
              <span className="text-xl font-medium text-muted">/5</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {data!.totalReviews} {data!.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>
      <hr className="mt-6 border-stone-200" />

      {data!.totalReviews > 0 ? (
        <>
          {/* 3. The latest review, visually set apart */}
          <section className="mt-10 rounded-lg border-l-2 border-accent bg-accent-soft px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-accent">Latest review</p>
            <p className="mt-2 text-lg">{data!.latestReview!.comment}</p>
            <p className="mt-3 text-sm text-muted">
              <Stars count={data!.latestReview!.rating} /> {" · "}
              {new Date(data!.latestReview!.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </p>
          </section>

          {/* 4. The older reviews, newest first, in a plain list */}
          <section>
            <h2 className="mt-10 text-sm font-medium text-muted">Earlier reviews</h2>
            <ul className="divide-y divide-stone-200">
              {data!.reviews.map((review) => (
                <li key={review.id} className="py-4">
                  <p>{review.comment}</p>
                  <p className="mt-2 text-sm text-muted">
                    <Stars count={review.rating} /> {" · "}
                    {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        /* The empty state: no facts yet, so nothing is computed and nothing is faked. */
        <section className="mt-10 rounded-lg border border-stone-200 px-5 py-8 text-center">
          <p className="text-muted">No reviews yet.</p>
          <p className="mt-2 text-sm text-muted">Be the one who starts the average.</p>
        </section>
      )}

      {/* 5. The only action — pinned to the bottom of the screen, no scrolling needed */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-stone-200 bg-background px-6 py-4">
        <div className="mx-auto max-w-[560px]">
          <Link
            href={`/review/${id}`}
            className="block rounded-lg bg-accent px-6 py-3 text-center text-white"
          >
            Write a review
          </Link>
        </div>
      </footer>
    </main>
  );
}
