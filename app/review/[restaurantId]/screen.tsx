"use client";

// Screen 1 — Write a review — /review/[restaurantId]
// A client component: the only kind of file allowed to respond to taps and clicks.
// It packages three facts, hands them to POST /api/reviews, and steps back.
// If the backend rejects the order, it prints the backend's words — nothing invented.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Star({ filled, onClick, label }: { filled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="transition-colors hover:opacity-70"
    >
      <svg viewBox="0 0 24 24" className={`h-9 w-9 ${filled ? "fill-accent" : "fill-stone-300"}`}>
        <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9 2.9-6z" />
      </svg>
    </button>
  );
}

export default function ReviewScreen({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The name at the top uses the same API the restaurant page uses — one contract, one truth.
  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}`)
      .then((res) => res.json())
      .then((data) => setRestaurantName(data.name))
      .catch(() => setRestaurantName(null));
  }, [restaurantId]);

  const canSubmit = rating >= 1 && comment.trim().length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: Number(restaurantId), rating, comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        // Not our message: the backend's, verbatim.
        setError(data.error);
        setSubmitting(false);
        return;
      }
      router.push(`/restaurant/${restaurantId}`);
    } catch {
      setError("Could not reach the server");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-foreground outline-none focus:border-accent";

  return (
    <main className="mx-auto max-w-[560px] px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {restaurantName ?? "Review"}
      </h1>
      <p className="mt-2 text-muted">How was it? Every review counts!</p>

      <div className="mt-10">
        <label className="text-sm font-medium">Rating</label>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} filled={n <= rating} onClick={() => setRating(n)} label={`${n} star${n > 1 ? "s" : ""}`} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <label className="text-sm font-medium">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="What did you think?"
          className={`mt-3 resize-none font-sans ${inputClass}`}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="mt-8 w-full rounded-lg bg-accent py-3 text-white transition-opacity disabled:opacity-30"
      >
        {submitting ? "Sending..." : "Submit review"}
      </button>

      <Link href={`/restaurant/${restaurantId}`} className="mt-4 inline-block text-sm text-muted hover:text-foreground">
        Back to the restaurant page
      </Link>
    </main>
  );
}
