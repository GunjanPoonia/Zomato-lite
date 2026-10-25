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

export default function RestaurantScreen({ params }: PageProps<"/restaurant/[id]">) {
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
    <main className="mx-auto max-w-[560px] px-6 py-16">
      {/* 1. The restaurant: name on top, cuisine + area underneath in small muted text */}
      <h1 className="text-2xl font-semibold tracking-tight">{data!.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {data!.cuisine}, {data!.area}
      </p>

      {/* 2. The average rating: the biggest thing on the page, with the count beside it.
          THE LINE: printed as received. If this looks right, the backend did the math. */}
      <div className="mt-10 flex items-end gap-3">
        <span className="text-6xl font-semibold tracking-tight">
          {data!.averageRating ?? "—"}
        </span>
        <span className="pb-2 text-sm text-muted">
          {data!.totalReviews} {data!.totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>

      {data!.totalReviews > 0 ? (
        <>
          {/* 3. The latest review, visually set apart */}
          <section className="mt-10 rounded-lg border-l-2 border-accent bg-accent-soft px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-accent">Latest</p>
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

      {/* 5. The link that starts it all */}
      <Link
        href={`/review/${id}`}
        className="mt-10 inline-block rounded-lg bg-accent px-6 py-3 text-white"
      >
        Write a review
      </Link>
    </main>
  );
}
