import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { terpeneCollections } from "../TerpeneShowcase/terpenesData";
import "../TerpeneShowcase/TerpeneShowcase.css"; // reuse your existing header styling
import "./ProductPage.css";

import bottleImg from "../../assets/bottle.png";
import elementLabsLogo from "../../assets/ElementLabsLogos.png";
import dt2 from "../../assets/dominant-terpenes-2.png";
import dt3 from "../../assets/dominant-terpenes-3.png";

const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "$0.00");

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

  const collection = useMemo(
    () => terpeneCollections.find((c) => c.id === id),
    [id]
  );

  // Gallery
  const galleryImages = useMemo(() => [bottleImg, dt2, dt3], []);
  const [activeImg, setActiveImg] = useState(0);

  // Variant-ish selections
  const profiles = collection?.profiles ?? [];
  const [profile, setProfile] = useState(profiles[0] ?? "");
  const [expandedProfile, setExpandedProfile] = useState("");
  useEffect(() => {
    setProfile(profiles[0] ?? "");
    setExpandedProfile(profiles[0] ?? "");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [jumpToId, setJumpToId] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [miniMenuOpen, setMiniMenuOpen] = useState(false);

  const flavorInfo = {
    intro:
      "Matrix offers bold, trendy flavors. Beyond classic fruit notes, each profile delivers vivid bursts of flavor and aroma, crafted to elevate the palate and turn every experience into something extraordinary.",
    flavorType: "Green Jelly Rancher",
    name: "Green Jelly Rancher",
    description:
      "Green Jelly Rancher explodes with a tangy, sour-sweet symphony. Zesty green apple and juicy melon mingle with candy-like notes, finishing with a bright, puckering sour kick that makes every sip lively and unforgettable.",
    dominantTerpenes: ["Ethyl Maltol", "Geraniol", "Linalool", "Beta-Caryophyllene"],
    flavorAroma: ["candy", "sweet", "sour", "green apple"],
    mood: "Uplift Inspired",
  };

  const miniMenuLeft = [
    "Savory",
    "Desserts",
    "Fruits",
    "Botanicals",
    "Treats",
    "Mixers",
    "Sips & Bites",
    "Fresh Picks",
    "Zest",
    "Essentials",
  ];
  const miniMenuRight = [
    "Wildcard",
    "Flavor Experiments",
    "Curiosities",
    "Twist & Shout",
    "Rebel Flavors",
    "Bizarre & Brilliant",
    "Taste Adventures",
    "Quirk & Perk",
    "Off the Map",
    "WTF Flavors",
  ];

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
      profile,
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

  const onJumpChange = (e) => {
    const nextId = e.target.value;
    setJumpToId(nextId);
    navigate("/");
    setTimeout(() => {
      const el = document.getElementById(`card-${nextId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const goToSection = (sectionId) => {
    navigate("/");
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    setMenuOpen(false);
  };

  const renderHeader = () => (
    <>
      <header className="ts-siteHeader">
        <nav
          className="ts-siteNav"
          aria-label="Primary"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <a
            href="/"
            className="ts-logoLink"
            aria-label="Element Labs Home"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            <img src={elementLabsLogo} alt="Element Labs Logo" className="ts-siteLogo" />
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div className="ts-jump" style={{ minWidth: 360, maxWidth: 420 }}>
              <input
                id="collectionJump"
                className="ts-select ts-selectSearch"
                type="text"
                value={jumpToId}
                onChange={onJumpChange}
                placeholder="Search collections"
                aria-label="Search collections"
              />
            </div>
            <button
              className="ts-menuBtn"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              style={{ marginRight: 8 }}
            >
              ☰
            </button>
          </div>
          <div className={`ts-navLinks ${menuOpen ? "isOpen" : ""}`}>
            <a
              href="/#contact"
              className="ts-siteNavLink"
              onClick={(e) => {
                e.preventDefault();
                goToSection("contact");
              }}
            >
              Contact
            </a>
            <a
              href="/#network"
              className="ts-siteNavLink"
              onClick={(e) => {
                e.preventDefault();
                goToSection("network");
              }}
            >
              Network
            </a>
            <a
              href="/#about"
              className="ts-siteNavLink"
              onClick={(e) => {
                e.preventDefault();
                goToSection("about");
              }}
            >
              About Us
            </a>
            <a
              href="/#supply-chain"
              className="ts-siteNavLink"
              onClick={(e) => {
                e.preventDefault();
                goToSection("supply-chain");
              }}
            >
              Supply Chain
            </a>
          </div>
        </nav>
      </header>
      <div className="ts-miniHeader">
        <div className="ts-miniHeaderInner">
          <div className="ts-miniMenu">
            <button
              className="ts-miniMenuBtn"
              type="button"
              aria-expanded={miniMenuOpen}
              aria-controls="mini-menu-panel"
              onClick={() => setMiniMenuOpen((v) => !v)}
            >
              ☰ All
            </button>
            {miniMenuOpen && (
              <div id="mini-menu-panel" className="ts-miniMenuPanel">
                <div className="ts-miniMenuGrid">
                  <div className="ts-miniMenuCol">
                    {miniMenuLeft.map((label) => (
                      <button key={label} type="button" className="ts-miniMenuItem">
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="ts-miniMenuCol">
                    {miniMenuRight.map((label) => (
                      <button key={label} type="button" className="ts-miniMenuItem">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="ts-miniLinks">
            <a href="/#terpenes" className="ts-miniLink" onClick={(e) => { e.preventDefault(); goToSection("terpenes"); }}>Terpenes</a>
            <a href="/#blends" className="ts-miniLink" onClick={(e) => { e.preventDefault(); goToSection("blends"); }}>Blends</a>
            <a href="/#isolates" className="ts-miniLink" onClick={(e) => { e.preventDefault(); goToSection("isolates"); }}>Isolates</a>
            <a href="/#lines" className="ts-miniLink" onClick={(e) => { e.preventDefault(); goToSection("lines"); }}>Lines</a>
          </div>
        </div>
      </div>
    </>
  );

  if (!collection) {
    return (
      <div className="pp-page">
        {renderHeader()}

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

  return (
    <div className="pp-page">
      {renderHeader()}

      <main className="pp-container">
        <div className="pp-topGrid">
          {/* LEFT: Images (smaller column) */}
          <section className="pp-card pp-galleryCard" aria-label="Product images">
            <div className="pp-galleryMain">
              <img
                src={galleryImages[activeImg]}
                className="pp-mainImg"
              />
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
              <div className="pp-body">
                Matrix offers bold, trendy flavors. Beyond classic fruit notes, each profile delivers vivid bursts of flavor and aroma, crafted to elevate the palate and turn every experience into something extraordinary.
              </div>
              <br></br>
              <div className="pp-muted">{collection.tagline}</div>
                          <div className="pp-galleryMeta">
              <h2 className="pp-h2">About this collection</h2>
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
                  <h3 className="pp-h3">Flavor Profiles</h3>
                  
{expandedProfile && (
  <div className="pp-ingredients pp-flavorInfo" aria-live="polite">
    <img
      src={dt2}
      alt={flavorInfo.name}
      className="pp-flavorHero"
    />

    <div className="pp-flavorTableWrap" aria-label="Flavor info table">
      <div className="pp-tableScroll">
        <table className="pp-flavorTable">
          <thead>
            <tr>
              <th>
                <span className="pp-thWithIcon">
                  <span className="pp-thIcon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">
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
                  Natural flavor (candy)
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
              <td className="pp-tdStrong">{flavorInfo.flavorType}</td>
              <td className="pp-tdDesc">{flavorInfo.description}</td>
              <td>
                <div className="pp-cellList">
                  {flavorInfo.dominantTerpenes.map((t) => (
                    <span key={t} className="pp-cellPill">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className="pp-cellList">
                  {flavorInfo.flavorAroma.map((note) => (
                    <span key={note} className="pp-cellPill">
                      {note}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                 <span style={{ color: "#eab308", fontWeight: 700 }}>{flavorInfo.mood}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
<div className="pp-chipGrid">
                    {profiles.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`pp-chip ${p === profile ? "isActive" : ""}`}
                        onClick={() => {
                          setProfile(p);
                          setExpandedProfile((prev) => (prev === p ? "" : p));
                        }}
                        aria-label={`Select profile ${p}`}
                      >
                        {p}
                      </button>
                    ))}
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
                    When you’re ready, drop PDFs into <code>/public/docs</code> and point these links to them.
                  </p>
                </>
              )}

              {tab === "Reviews" && (
                <>
                  <div className="pp-reviewHeader">
                    <div>
                      <h2 className="pp-h2" style={{ marginBottom: 6 }}>Customer reviews</h2>
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
                          className="pp-input"
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="pp-label">
                      Review
                      <textarea
                        className="pp-input pp-textarea"
                        value={reviewForm.text}
                        onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                        placeholder="What did you like? How did it perform?"
                      />
                    </label>

                    <button className="pp-primaryBtn" type="submit">
                      Submit review
                    </button>
                  </form>

                  <div className="pp-reviewList">
                    {reviews.length === 0 && <div className="pp-muted">No reviews yet. Be the first.</div>}
                    {reviews.map((r, idx) => (
                      <div key={idx} className="pp-reviewItem">
                        <div className="pp-reviewTop">
                          <strong>{r.name}</strong>
                          <span className="pp-muted">{new Date(r.at).toLocaleDateString()}</span>
                        </div>
                        <div className="pp-ratingRow">
                          <Stars value={r.rating} /> <span className="pp-muted">{r.rating} / 5</span>
                        </div>
                        {r.text ? <p className="pp-body" style={{ marginTop: 8 }}>{r.text}</p> : null}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "Shipping" && (
                <>
                  <h2 className="pp-h2">Shipping & returns</h2>
                  <ul className="pp-list">
                    <li>Ships in 1–2 business days (placeholder).</li>
                    <li>Tracking provided via email.</li>
                    <li>Returns accepted on unopened items within 14 days (placeholder).</li>
                  </ul>
                  <p className="pp-muted">
                    Replace this with your real policy copy when ready.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* RIGHT: Checkout / Buy box */}
          <aside className="pp-card pp-buyCard" aria-label="Purchase options">
            <div className="pp-buySticky">
              <div className="pp-buyTitle">{collection.name}</div>

              <div className="pp-ratingRow">
                <Stars value={avgRating} />
                <span className="pp-muted">{reviews.length} reviews</span>
              </div>

              <div className="pp-price">{money(price)}</div>
              <div className="pp-muted">Taxes calculated at checkout (placeholder)</div>

              <div className="pp-divider" />

              <label className="pp-label">
                Profile
                <select className="pp-input" value={profile} onChange={(e) => setProfile(e.target.value)}>
                  {profiles.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <div className="pp-formRow">
                <label className="pp-label">
                  Size
                  <select className="pp-input" value={size} onChange={(e) => setSize(e.target.value)}>
                    <option value="15ml">15ml</option>
                    <option value="30ml">30ml</option>
                  </select>
                </label>

                <label className="pp-label">
                  Qty
                  <input
                    className="pp-input"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
              </div>

              <button className="pp-primaryBtn pp-wideBtn" type="button" onClick={addToCart}>
                Add to cart
              </button>

              <button
                className="pp-secondaryBtn pp-wideBtn"
                type="button"
                onClick={() => alert("Wire this to checkout when ready.")}
              >
                Buy now
              </button>

              <div className="pp-miniInfo">
                <div><strong>In Stock</strong> (placeholder)</div>
                <div className="pp-muted">Free shipping over $99 (placeholder)</div>
                <div className="pp-muted">Lab-tested blends</div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
