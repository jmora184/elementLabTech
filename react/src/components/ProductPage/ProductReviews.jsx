import React, { useMemo, useState } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function loadReviews(productId) {
  try {
    const raw = localStorage.getItem(`elementlab_reviews__${productId}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveReviews(productId, reviews) {
  localStorage.setItem(`elementlab_reviews__${productId}`, JSON.stringify(reviews));
}

export default function ProductReviews({ productId }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const reviews = useMemo(() => {
    const stored = loadReviews(productId);
    if (stored.length) return stored;

    // Default seed reviews (so page doesn't look empty)
    return [
      {
        id: "seed-1",
        name: "Brand Owner",
        rating: 5,
        text: "Very consistent flavor and aroma across batches. Exactly what we needed for scale.",
        date: "2026-01-10",
      },
      {
        id: "seed-2",
        name: "Formulator",
        rating: 4,
        text: "Clean top notes. Would love a COA attached directly on the page (documents tab works for now).",
        date: "2026-01-18",
      },
    ];
  }, [productId, refreshKey]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  }, [reviews]);

  const breakdown = useMemo(() => {
    const b = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => (b[r.rating] = (b[r.rating] || 0) + 1));
    return b;
  }, [reviews]);

  const submit = (e) => {
    e.preventDefault();
    const next = [
      {
        id: crypto?.randomUUID?.() || String(Date.now()),
        name: name.trim() || "Anonymous",
        rating: clamp(Number(rating) || 5, 1, 5),
        text: text.trim(),
        date: new Date().toISOString().slice(0, 10),
      },
      ...loadReviews(productId), // user-submitted only
    ];
    saveReviews(productId, next);
    setName("");
    setRating(5);
    setText("");
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="pp-reviews">
      <div className="pp-section">
        <h3 className="pp-h3">Customer Reviews</h3>

        <div className="pp-reviewGrid">
          <div className="pp-reviewSummary">
            <div className="pp-reviewAvg">
              <div className="pp-reviewAvgNum">{avg.toFixed(1)}</div>
              <div className="pp-reviewStars">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</div>
              <div className="pp-reviewCount">{reviews.length} total</div>
            </div>

            <div className="pp-reviewBars" aria-label="Rating breakdown">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = breakdown[r] || 0;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div className="pp-barRow" key={r}>
                    <span className="pp-barLabel">{r}★</span>
                    <div className="pp-barTrack">
                      <div className="pp-barFill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="pp-barCount">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <form className="pp-reviewForm" onSubmit={submit}>
            <div className="pp-formTitle">Write a review</div>

            <label className="pp-formLabel">
              Name
              <input
                className="pp-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>

            <label className="pp-formLabel">
              Rating
              <select className="pp-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Okay</option>
                <option value={2}>2 - Not great</option>
                <option value={1}>1 - Bad</option>
              </select>
            </label>

            <label className="pp-formLabel">
              Review
              <textarea
                className="pp-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                required
              />
            </label>

            <button className="pp-primaryBtn" type="submit">Submit</button>
            <div className="pp-note">
              Reviews are stored locally in your browser for now (wire to your backend later).
            </div>
          </form>
        </div>
      </div>

      <div className="pp-section">
        <h3 className="pp-h3">Top reviews</h3>
        <div className="pp-reviewList">
          {reviews.map((r) => (
            <div className="pp-reviewCard" key={r.id}>
              <div className="pp-reviewHeader">
                <div className="pp-reviewName">{r.name}</div>
                <div className="pp-reviewMeta">
                  <span className="pp-reviewStarsMini">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span className="pp-reviewDate">{r.date}</span>
                </div>
              </div>
              <div className="pp-reviewText">{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
