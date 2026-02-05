import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { terpeneCollections } from "../TerpeneShowcase/terpenesData";
import "./ProductPage.css";
// Header is provided globally by SiteLayout.

import bottleImg from "../../assets/bottle.png";
import dt2 from "../../assets/dominant-terpenes-2.png";
import dt3 from "../../assets/dominant-terpenes-3.png";

const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "$0.00");

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function Stars({ value = 4.8 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const isFull = i < full;
    const isHalf = i === full && half;
    return (
      <span key={i} className="pp-star" aria-hidden="true">
        {isFull ? "★" : isHalf ? "⯨" : "☆"}
      </span>
    );
  });
  return <span className="pp-stars">{stars}</span>;
}

export default function ProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Fallback: still supports hardcoded collections while we migrate the UI.
  const hardcodedCollection = useMemo(
    () => terpeneCollections.find((c) => c.id === id),
    [id]
  );

  // DB-backed collection + profiles (new)
  const [dbCollection, setDbCollection] = useState(null);
  const [dbProfiles, setDbProfiles] = useState([]); // array of profile rows
  const [selectedSlug, setSelectedSlug] = useState("");
  const [expandedSlug, setExpandedSlug] = useState("");
  const [profileBundle, setProfileBundle] = useState(null); // { profile, images, documents }
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Auth for admin UI
  const [me, setMe] = useState(null);
  const isAdmin = me?.role === "admin";

  // Load current user (role comes from /api/auth/me)
  useEffect(() => {
    let alive = true;
    fetchJson("/api/auth/me")
      .then((d) => {
        if (!alive) return;
        setMe(d?.user || null);
      })
      .catch(() => {
        if (!alive) return;
        setMe(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Load collection + profile list from DB for this product id
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;
      setLoadingProfiles(true);
      setDbCollection(null);
      setDbProfiles([]);
      setSelectedSlug("");
      setExpandedSlug("");
      setProfileBundle(null);

      try {
        const col = await fetchJson(`/api/collections/${encodeURIComponent(id)}`);
        if (!alive) return;
        setDbCollection(col?.collection || null);

        const list = await fetchJson(`/api/collections/${encodeURIComponent(id)}/profiles`);
        if (!alive) return;

        const profiles = Array.isArray(list?.profiles) ? list.profiles : [];
        setDbProfiles(profiles);

        const first = profiles[0]?.slug || "";
        setSelectedSlug(first);
        setExpandedSlug(first);
      } catch (err) {
        // DB not ready / not seeded / endpoint missing: fall back to hardcoded UI
        console.warn("DB collection/profiles load failed, falling back to hardcoded:", err?.message || err);
      } finally {
        if (alive) setLoadingProfiles(false);
      }
    }

    load();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      alive = false;
    };
  }, [id]);

  // Load the selected profile details bundle
  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      if (!selectedSlug) return;
      setLoadingProfile(true);
      try {
        const bundle = await fetchJson(`/api/profiles/${encodeURIComponent(selectedSlug)}`);
        if (!alive) return;
        setProfileBundle(bundle);
      } catch (err) {
        console.warn("Profile bundle load failed:", err?.message || err);
        if (alive) setProfileBundle(null);
      } finally {
        if (alive) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      alive = false;
    };
  }, [selectedSlug]);

  // Use DB collection when present, otherwise fallback to hardcoded
  const collection = dbCollection || hardcodedCollection;

  // Gallery: for now keep the local placeholders; later we’ll use DB images (R2 URLs).
  const galleryImages = useMemo(() => [bottleImg, dt2, dt3], []);
  const [activeImg, setActiveImg] = useState(0);

  // Variant-ish selections
  const hardcodedProfiles = collection?.profiles ?? [];
  const profileDisplayRows = dbProfiles.length
    ? dbProfiles.map((p) => ({ slug: p.slug, label: p.name || p.slug }))
    : hardcodedProfiles.map((name) => ({ slug: name, label: name })); // fallback uses name as slug too (until fully migrated)

  const selectedLabel = useMemo(() => {
    const hit = profileDisplayRows.find((p) => p.slug === selectedSlug);
    return hit?.label || "";
  }, [profileDisplayRows, selectedSlug]);

  // If we're in fallback mode, keep the previous behavior:
  const [fallbackProfile, setFallbackProfile] = useState(hardcodedProfiles[0] ?? "");
  useEffect(() => {
    setFallbackProfile(hardcodedProfiles[0] ?? "");
  }, [id]); // reset on route change

  const [size, setSize] = useState("15ml");
  const [qty, setQty] = useState(1);

  const price = useMemo(() => {
    const base = size === "30ml" ? 39.99 : 24.99;
    return base * Math.max(1, qty);
  }, [size, qty]);

  // Tabs (middle column)
  const tabs = ["Details", "Specs", "Documents", "Reviews", "Shipping", "Isolates", "Terpenes"];
  const [tab, setTab] = useState("Details");

  const [cartCount, setCartCount] = useState(0);

  // Flavor info: DB-backed when available; otherwise show the old placeholder
  const dbProfile = profileBundle?.profile || null;

  const flavorInfo = useMemo(() => {
    if (dbProfile) {
      return {
        intro: collection?.description || "",
        flavorType: dbProfile.flavor_type || dbProfile.name || "",
        flavorCategory: dbProfile.flavor_category || "",
        name: dbProfile.name || "",
        description: dbProfile.description || "",
        dominantTerpenes: Array.isArray(dbProfile.dominant_terpenes) ? dbProfile.dominant_terpenes : [],
        flavorAroma: Array.isArray(dbProfile.flavor_aroma) ? dbProfile.flavor_aroma : [],
        mood: dbProfile.mood || "",
      };
    }

    // Old placeholder (until all profiles are migrated)
    return {
      intro:
        "Matrix offers bold, trendy flavors. Beyond classic fruit notes, each profile delivers vivid bursts of flavor and aroma, crafted to elevate the palate and turn every experience into something extraordinary.",
      flavorType: "Green Jelly Rancher",
      flavorCategory: "Candy",
      name: "Green Jelly Rancher",
      description:
        "Green Jelly Rancher explodes with a tangy, sour-sweet symphony. Zesty green apple and juicy melon mingle with candy-like notes, finishing with a bright, puckering sour kick that makes every sip lively and unforgettable.",
      dominantTerpenes: ["Ethyl Maltol", "Geraniol", "Linalool", "Beta-Caryophyllene"],
      flavorAroma: ["candy", "sweet", "sour", "green apple"],
      mood: "Uplift Inspired",
    };
  }, [dbProfile, collection?.description]);

  // Lightweight local reviews for now (so page feels real)
  const reviewKey = `el_reviews_${id || "unknown"}`;
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(reviewKey);
      setReviews(raw ? JSON.parse(raw) : []);
    } catch {
      setReviews([]);
    }
  }, [reviewKey]);

  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, text: "" });

  const avgRating = useMemo(() => {
    if (!reviews.length) return 4.8;
    const s = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

  const addReview = (e) => {
    e.preventDefault();
    const next = [
      {
        name: reviewForm.name || "Anonymous",
        rating: Number(reviewForm.rating) || 5,
        text: reviewForm.text || "",
        at: new Date().toISOString(),
      },
      ...reviews,
    ];
    setReviews(next);
    localStorage.setItem(reviewKey, JSON.stringify(next));
    setReviewForm({ name: "", rating: 5, text: "" });
    setTab("Reviews");
  };

  const addToCart = () => {
    const cartKey = "el_cart";
    const item = {
      id,
      collectionName: collection?.name ?? id,
      profile: dbProfiles.length ? selectedLabel : fallbackProfile,
      size,
      qty,
      unitPrice: size === "30ml" ? 39.99 : 24.99,
      img: bottleImg,
      addedAt: Date.now(),
    };
    try {
      const raw = localStorage.getItem(cartKey);
      const current = raw ? JSON.parse(raw) : [];
      const next = [item, ...current];
      localStorage.setItem(cartKey, JSON.stringify(next));
      const count = Array.isArray(next)
        ? next.reduce((acc, it) => acc + (Number(it.qty) || 1), 0)
        : 0;
      setCartCount(count);
      alert("Added to cart (saved locally).");
    } catch {
      alert("Could not save cart.");
    }
  };

  useEffect(() => {
    const readCartCount = () => {
      try {
        const raw = localStorage.getItem("el_cart");
        const items = raw ? JSON.parse(raw) : [];
        const count = Array.isArray(items)
          ? items.reduce((acc, it) => acc + (Number(it.qty) || 1), 0)
          : 0;
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    readCartCount();
    const onStorage = (e) => {
      if (e.key === "el_cart") readCartCount();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!collection) {
    return (
      <div className="pp-page">
        <main className="pp-container">
          <div className="pp-card">
            <h1 className="pp-h1">Product not found</h1>
            <p className="pp-muted">That product id doesn’t match a collection.</p>
            <button className="pp-primaryBtn" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        </main>
      </div>
    );
  }

  const documents = profileBundle?.documents || [];

  return (
    <div className="pp-page">
      <main className="pp-container">
        <div className="pp-topGrid">
          {/* LEFT: Images (smaller column) */}
          <section className="pp-card pp-galleryCard" aria-label="Product images">
            <div className="pp-galleryMain">
              <img src={galleryImages[activeImg]} className="pp-mainImg" />
            </div>

            <div className="pp-thumbRow" role="list" aria-label="Image thumbnails">
              {galleryImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pp-thumb ${i === activeImg ? "isActive" : ""}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>

            <div className="pp-galleryMeta">
              <div className="pp-collectionName">{collection.name}</div>
              <div className="pp-body">{flavorInfo.intro}</div>
              <br></br>
              <div className="pp-muted">{collection.tagline}</div>
              <div className="pp-galleryMeta">
                <p className="pp-body">{collection.description}</p>
              </div>
            </div>
          </section>

          {/* MIDDLE: Details / Docs / Info (tabs) */}
          <section className="pp-card pp-infoCard" aria-label="Details and information">
            <div className="pp-tabBar" role="tablist" aria-label="Product tabs">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  className={`pp-tabBtn ${tab === t ? "isActive" : ""}`}
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="pp-tabPanel" role="tabpanel">
              {tab === "Details" && (
                <>
                  {/* Flavor info */}
                  {(expandedSlug || expandedSlug === selectedSlug || expandedSlug) && (
                    <div className="pp-ingredients pp-flavorInfo" aria-live="polite">
                      <div className="pp-flavorTitle">
                        {flavorInfo.flavorType}
                        {flavorInfo.flavorCategory ? ` (${flavorInfo.flavorCategory})` : ""}
                      </div>

                      {/* Placeholder hero until DB images are wired */}
                      <img src={dt2} alt={flavorInfo.name} className="pp-flavorHero" />

                      {loadingProfile && (
                        <div className="pp-muted" style={{ marginTop: 10 }}>
                          Loading profile…
                        </div>
                      )}

                      <div className="pp-flavorTableWrap" aria-label="Flavor info table">
                        <div className="pp-tableScroll">
                          <table className="pp-flavorTable">
                            <thead>
                              <tr>
                                <th>
                                  <span className="pp-thWithIcon">
                                    <span className="pp-thIcon" aria-hidden="true">
                                      <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        focusable="false"
                                        aria-hidden="true"
                                      >
                                        <path
                                          fill="currentColor"
                                          d="M7.3 6.2c1.1-1.7 3-2.9 4.7-2.9s3.6 1.2 4.7 2.9c.6 1 1.2 1.7 2.6 2.3c.5.2.8.7.7 1.2c-.3 1.6-1.3 2.5-2.1 3.1c-.4.3-.7.6-.9.9c-.4.6-.5 1.3-.4 2.3c.1 1-.1 2-.9 2.8c-.9.9-2.3 1.2-4 1.2s-3.1-.3-4-1.2c-.8-.8-1-1.8-.9-2.8c.1-1-.1-1.7-.4-2.3c-.2-.3-.5-.6-.9-.9c-.8-.6-1.8-1.5-2.1-3.1c-.1-.5.2-1 .7-1.2c1.4-.6 2-.3 2.6-2.3Z"
                                          opacity="0.25"
                                        />
                                        <path
                                          fill="currentColor"
                                          d="M9.2 6.8c.8-1.2 2-2 2.8-2s2 .8 2.8 2c.5.8 1 1.3 2 1.8c.2.1.3.3.3.5c-.2 1-.8 1.6-1.4 2c-.5.4-1 .8-1.3 1.4c-.6 1.1-.5 2.2-.4 3.1c.1.8 0 1.2-.3 1.6c-.5.5-1.6.8-3.1.8s-2.6-.3-3.1-.8c-.3-.4-.4-.8-.3-1.6c.1-.9.2-2-.4-3.1c-.3-.6-.8-1-1.3-1.4c-.6-.4-1.2-1-1.4-2c0-.2.1-.4.3-.5c1-.5 1.5-1 2-1.8Z"
                                        />
                                      </svg>
                                    </span>
                                    Natural flavor
                                  </span>
                                </th>
                                <th>Description under Flavor Name</th>
                                <th>Dominant terpenes</th>
                                <th>Flavor and aroma</th>
                                <th>Mood</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="pp-tdStrong" data-label="Natural flavor">
                                  {flavorInfo.flavorType}
                                  {flavorInfo.flavorCategory ? ` (${flavorInfo.flavorCategory})` : ""}
                                </td>
                                <td className="pp-tdDesc" data-label="Description under Flavor Name">
                                  {flavorInfo.description}
                                </td>
                                <td data-label="Dominant terpenes">
                                  <div className="pp-cellList">
                                    {(flavorInfo.dominantTerpenes || []).map((t) => (
                                      <span key={t} className="pp-cellPill">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td data-label="Flavor and aroma">
                                  <div className="pp-cellList">
                                    {(flavorInfo.flavorAroma || []).map((note) => (
                                      <span key={note} className="pp-cellPill">
                                        {note}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td data-label="Mood">
                                  <span style={{ color: "#eab308", fontWeight: 700 }}>{flavorInfo.mood}</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Flavor profiles list */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <h3 className="pp-h3" style={{ margin: 0 }}>Flavor Profiles</h3>

                    {isAdmin && (
                      <button
                        type="button"
                        className="pp-primaryBtn"
                        style={{ padding: "8px 12px", fontSize: 14 }}
                        onClick={() => alert("Admin: next step is Add Profile UI + POST endpoint.")}
                        aria-label="Add flavor profile"
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  {loadingProfiles && (
                    <div className="pp-muted" style={{ marginTop: 10 }}>
                      Loading profiles…
                    </div>
                  )}

                  <div className="pp-chipGrid">
                    {profileDisplayRows.map((p) => {
                      const isActive = dbProfiles.length ? p.slug === selectedSlug : p.label === fallbackProfile;
                      return (
                        <button
                          key={p.slug}
                          type="button"
                          className={`pp-chip ${isActive ? "isActive" : ""}`}
                          onClick={() => {
                            if (dbProfiles.length) {
                              setSelectedSlug(p.slug);
                              setExpandedSlug((prev) => (prev === p.slug ? "" : p.slug));
                            } else {
                              setFallbackProfile(p.label);
                            }
                          }}
                          aria-label={`Select profile ${p.label}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {tab === "Specs" && (
                <>
                  <h2 className="pp-h2">Specs</h2>
                  <table className="pp-specTable">
                    <tbody>
                      <tr>
                        <th>Collection</th>
                        <td>{collection.name}</td>
                      </tr>
                      <tr>
                        <th>Type</th>
                        <td>Botanical terpene blend collection</td>
                      </tr>
                      <tr>
                        <th>Available sizes</th>
                        <td>15ml, 30ml</td>
                      </tr>
                      <tr>
                        <th>Recommended use</th>
                        <td>Flavor/aroma enhancement (vapes, prerolls, extracts)</td>
                      </tr>
                      <tr>
                        <th>Storage</th>
                        <td>Cool, dark place; tightly sealed</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {tab === "Documents" && (
                <>
                  <h2 className="pp-h2">Documents</h2>

                  {documents.length ? (
                    <div className="pp-docList">
                      {documents.map((d) => (
                        <a
                          key={d.id || d.url}
                          className="pp-docBtn"
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {d.title || "Document"}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="pp-docList">
                        <a className="pp-docBtn" href="#" onClick={(e) => e.preventDefault()}>
                          COA (placeholder)
                        </a>
                        <a className="pp-docBtn" href="#" onClick={(e) => e.preventDefault()}>
                          SDS (placeholder)
                        </a>
                        <a className="pp-docBtn" href="#" onClick={(e) => e.preventDefault()}>
                          Spec Sheet (placeholder)
                        </a>
                      </div>
                      <p className="pp-muted" style={{ marginTop: 10 }}>
                        Next step: store docs in D1 (done) + add admin upload/URL UI.
                      </p>
                    </>
                  )}
                </>
              )}

              {/* The rest of the tabs are unchanged from your existing file */}
              {tab === "Reviews" && (
                <>
                  <div className="pp-reviewHeader">
                    <div>
                      <h2 className="pp-h2" style={{ marginBottom: 6 }}>
                        Customer reviews
                      </h2>
                      <div className="pp-ratingRow">
                        <Stars value={avgRating} />
                        <span className="pp-ratingText">{avgRating} / 5</span>
                        <span className="pp-muted">({reviews.length} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <form className="pp-reviewForm" onSubmit={addReview}>
                    <div className="pp-formRow">
                      <label className="pp-label">
                        Name
                        <input
                          className="pp-input"
                          value={reviewForm.name}
                          onChange={(e) => setReviewForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Your name"
                        />
                      </label>

                      <label className="pp-label">
                        Rating
                        <select
                          className="pp-select"
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                        >
                          {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="pp-label">
                      Review
                      <textarea
                        className="pp-textarea"
                        value={reviewForm.text}
                        onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                        placeholder="Write your review..."
                        rows={4}
                      />
                    </label>

                    <button type="submit" className="pp-primaryBtn">
                      Submit review
                    </button>
                  </form>

                  <div className="pp-reviewList">
                    {reviews.length === 0 ? (
                      <p className="pp-muted">No reviews yet — be the first.</p>
                    ) : (
                      reviews.map((r, idx) => (
                        <div key={idx} className="pp-reviewItem">
                          <div className="pp-reviewTop">
                            <strong>{r.name}</strong>
                            <Stars value={Number(r.rating) || 5} />
                          </div>
                          <div className="pp-muted pp-reviewDate">
                            {r.at ? new Date(r.at).toLocaleString() : ""}
                          </div>
                          <p className="pp-body">{r.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {tab === "Shipping" && (
                <>
                  <h2 className="pp-h2">Shipping</h2>
                  <p className="pp-body">
                    Fast, discreet shipping. Orders typically process in 1–2 business days.
                  </p>
                </>
              )}

              {tab === "Isolates" && (
                <>
                  <h2 className="pp-h2">Isolates</h2>
                  <p className="pp-body">Coming soon.</p>
                </>
              )}

              {tab === "Terpenes" && (
                <>
                  <h2 className="pp-h2">Terpenes</h2>
                  <p className="pp-body">Coming soon.</p>
                </>
              )}
            </div>
          </section>

          {/* RIGHT: Purchase box */}
          <section className="pp-card pp-buyCard" aria-label="Purchase options">
            <div className="pp-priceRow">
              <div className="pp-price">{money(price)}</div>
              <div className="pp-muted">
                <span className="pp-stockDot" /> In stock
              </div>
            </div>

            <div className="pp-divider" />

            <label className="pp-label">
              Size
              <select className="pp-select" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="15ml">15ml</option>
                <option value="30ml">30ml</option>
              </select>
            </label>

            <label className="pp-label">
              Quantity
              <div className="pp-qtyRow">
                <button
                  type="button"
                  className="pp-qtyBtn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  className="pp-qtyInput"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="pp-qtyBtn"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </label>

            <button type="button" className="pp-primaryBtn" onClick={addToCart}>
              Add to cart
            </button>

            <div className="pp-cartMeta">
              <span className="pp-muted">Cart items:</span> <strong>{cartCount}</strong>
            </div>

            <div className="pp-divider" />

            <div className="pp-bullets">
              <div>✔ Lab-grade botanical profiles</div>
              <div>✔ Designed for vapes & extracts</div>
              <div>✔ Small-batch quality</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
