import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { terpeneCollections } from "../TerpeneShowcase/terpenesData";
import bottleImg from "../../assets/bottle.png";
import pattern2 from "../../assets/dominant-terpenes-2.png";
import pattern3 from "../../assets/dominant-terpenes-3.png";
import elementLabsLogo from "../../assets/ElementLabsLogos.png";

import ProductGallery from "./ProductGallery";
import ProductTabs from "./ProductTabs";

import "./ProductPage.css";

function formatMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
}

function titleCase(s) {
  return String(s || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = useMemo(
    () => terpeneCollections.find((c) => c.id === id),
    [id]
  );

  // Basic “variant” idea: choose a profile within the collection (Amazon-style options)
  const profiles = product?.profiles ?? [];
  const [selectedProfile, setSelectedProfile] = useState(profiles[0] ?? "");
  const [size, setSize] = useState("15ml");
  const [qty, setQty] = useState(1);

  // Placeholder pricing logic: adjust however you price your catalog
  const price = useMemo(() => {
    // Simple example: larger sizes cost more
    const base = 24.99;
    if (size === "30ml") return base + 15;
    if (size === "60ml") return base + 40;
    return base;
  }, [size]);

  const galleryImages = useMemo(() => {
    // Use your bottle image as a base (swap these for real product photos when ready)
    return [
      { src: bottleImg, alt: (product?.name ?? "Product") + " bottle" },
      { src: bottleImg, alt: (product?.name ?? "Product") + " bottle (angle 2)" },
      { src: bottleImg, alt: (product?.name ?? "Product") + " bottle (label close-up)" },
    ];
  }, [product]);

  const accentPattern = useMemo(() => {
    // Rotate between patterns so different product pages feel distinct
    return id?.includes("emerald") ? pattern3 : pattern2;
  }, [id]);

  if (!product) {
    return (
      <div className="pp-page">
        <header className="pp-topbar">
          <button className="pp-backBtn" onClick={() => navigate("/")}>← Back</button>
          <img src={elementLabsLogo} alt="Element Labs" className="pp-logo" />
        </header>

        <div className="pp-notFound">
          <h1>Product not found</h1>
          <p>
            We couldn’t find <b>{titleCase(id)}</b>. Go back to the catalog and try again.
          </p>
          <Link className="pp-primaryBtn" to="/">Go to Home</Link>
        </div>
      </div>
    );
  }

  const bullets = [
    "Botanical terpene isolates",
    "Designed for consistency at scale",
    "Made for vapes, pre-rolls, and infusion",
  ];

  return (
    <div className="pp-page">
      <header className="pp-topbar">
        <Link to="/" className="pp-brand" aria-label="Back to home">
          <img src={elementLabsLogo} alt="Element Labs" className="pp-logo" />
        </Link>
        <div className="pp-topActions">
          <button className="pp-ghostBtn" onClick={() => navigate("/")}>Catalog</button>
          <a className="pp-ghostBtn" href="/#contact">Contact</a>
        </div>
      </header>

      <nav className="pp-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="pp-crumb">Home</Link>
        <span className="pp-crumbSep">/</span>
        <span className="pp-crumb">{product.name}</span>
      </nav>

      <main className="pp-main">
        {/* LEFT: Gallery */}
        <section className="pp-left">
          <div className="pp-galleryCard">
            <div
              className="pp-pattern"
              aria-hidden="true"
              style={{ backgroundImage: `url(${accentPattern})` }}
            />
            <ProductGallery images={galleryImages} />
          </div>

          <div className="pp-trustRow">
            <div className="pp-trustItem">✅ Lab-focused</div>
            <div className="pp-trustItem">🚚 Fast fulfillment</div>
            <div className="pp-trustItem">📄 COA/SDS on request</div>
          </div>
        </section>

        {/* RIGHT: Details / Buy Box */}
        <aside className="pp-right">
          <div className="pp-buyBox">
            <div className="pp-badge">{product.badge}</div>
            <h1 className="pp-title">{product.name}</h1>
            <div className="pp-subtitle">{product.tagline}</div>

            <div className="pp-ratingRow" aria-label="Rating">
              <div className="pp-stars" title="4.8 out of 5">
                ★★★★☆ <span className="pp-ratingNum">4.8</span>
              </div>
              <a className="pp-reviewLink" href="#reviews">132 reviews</a>
            </div>

            <div className="pp-priceRow">
              <div className="pp-price">{formatMoney(price)}</div>
              <div className="pp-priceNote">Free shipping over {formatMoney(150)}</div>
            </div>

            <ul className="pp-bullets">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            <div className="pp-optionGrid">
              <label className="pp-label">
                Profile
                <select
                  className="pp-select"
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                >
                  {profiles.map((p) => (
                    <option value={p} key={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="pp-label">
                Size
                <select className="pp-select" value={size} onChange={(e) => setSize(e.target.value)}>
                  <option value="15ml">15ml</option>
                  <option value="30ml">30ml</option>
                  <option value="60ml">60ml</option>
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
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
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
            </div>

            <div className="pp-ctaRow">
              <button
                className="pp-primaryBtn"
                type="button"
                onClick={() => {
                  // Very simple localStorage cart (so you can wire it later)
                  const key = "elementlab_cart";
                  const current = JSON.parse(localStorage.getItem(key) || "{}");
                  const lineId = `${product.id}__${selectedProfile}__${size}`;
                  const nextQty = (current[lineId]?.qty || 0) + qty;
                  current[lineId] = {
                    id: product.id,
                    name: product.name,
                    profile: selectedProfile,
                    size,
                    price,
                    qty: nextQty,
                  };
                  localStorage.setItem(key, JSON.stringify(current));
                  alert("Added to cart ✅");
                }}
              >
                Add to Cart
              </button>

              <button
                className="pp-buyNowBtn"
                type="button"
                onClick={() => alert("Hook this to checkout when ready")}
              >
                Buy Now
              </button>
            </div>

            <div className="pp-shipBox">
              <div className="pp-shipLine"><b>In Stock</b> — ships in 1–2 business days</div>
              <div className="pp-shipLine">Estimated delivery: 3–5 business days</div>
              <div className="pp-shipLine">Returns: accepted on unopened items</div>
            </div>

            <div className="pp-docTeaser">
              <div className="pp-docTitle">Documents</div>
              <div className="pp-docBody">
                COA / SDS / Spec sheet available in the Documents tab.
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* BELOW: Tabs like Amazon */}
      <section className="pp-tabsWrap">
        <ProductTabs
          product={product}
          selectedProfile={selectedProfile}
          size={size}
          price={price}
        />
      </section>

      <footer className="pp-footer">
        <div className="pp-footerInner">
          <div>© {new Date().getFullYear()} Element Lab</div>
          <a href="/#contact" className="pp-footerLink">Contact</a>
        </div>
      </footer>
    </div>
  );
}
