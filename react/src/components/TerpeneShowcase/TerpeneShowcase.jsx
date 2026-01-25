import React, { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { heroCopy, terpeneCollections } from "./terpenesData";
import "./TerpeneShowcase.css";
import bottleImg from '../../assets/bottle.png';
import elementLabsLogo from '../../assets/ElementLabsLogos.png';

/**
 * TerpeneShowcase
 * - Abstrax-style yellow section
 * - Centered card carousel w/ dots + arrows
 * - Dropdown to jump to a collection
 *
 * Install deps:
 *   npm i embla-carousel embla-carousel-react
 */

export default function TerpeneShowcase() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    skipSnaps: false,
    dragFree: false,
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [jumpToId, setJumpToId] = useState(terpeneCollections[0]?.id ?? "");

  // --- Cart State ---
  // cart: { [profileName]: quantity }
  const [cart, setCart] = useState({});

  const addToCart = (profile) => {
    setCart((prev) => ({ ...prev, [profile]: (prev[profile] || 0) + 1 }));
  };
  const removeFromCart = (profile) => {
    setCart((prev) => {
      const qty = (prev[profile] || 0) - 1;
      if (qty <= 0) {
        const { [profile]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [profile]: qty };
    });
  };
  const setCartQuantity = (profile, qty) => {
    setCart((prev) => {
      if (qty <= 0) {
        const { [profile]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [profile]: qty };
    });
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnapCount(emblaApi.scrollSnapList().length);
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  const idToIndex = useMemo(() => {
    const map = new Map();
    terpeneCollections.forEach((c, i) => map.set(c.id, i));
    return map;
  }, []);

  const onJumpChange = (e) => {
    const id = e.target.value;
    setJumpToId(id);
    const idx = idToIndex.get(id);
    if (typeof idx === "number") scrollTo(idx);
  };

  return (
    <>
      <header className="ts-siteHeader">
        <nav className="ts-siteNav">
          <img src={elementLabsLogo} alt="Element Labs Logo" className="ts-siteLogo" />
          <a href="#contact" className="ts-siteNavLink">Contact</a>
          <a href="#network" className="ts-siteNavLink">Network</a>
          <a href="#about" className="ts-siteNavLink">About Us</a>
          <a href="#supply-chain" className="ts-siteNavLink">Supply Chain</a>
        </nav>
      </header>
      <section className="ts-section">
        <div className="ts-inner">
          <div className="ts-header">
            <div className="ts-kicker">{heroCopy.eyebrow}</div>
            <h2 className="ts-title">Terpenes By Element Labs</h2>

            <div className="ts-controls">
            <div className="ts-jump">
              <label className="ts-jumpLabel" htmlFor="collectionJump">
                Shop Terpene Collections
              </label>
              <select
                id="collectionJump"
                className="ts-select"
                value={jumpToId}
                onChange={onJumpChange}
              >
                {terpeneCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.badge} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ts-nav">
              <div className="ts-dots" aria-label="carousel page indicators">
                {Array.from({ length: snapCount }).map((_, i) => (
                  <button
                    key={i}
                    className={`ts-dot ${i === selectedIndex ? "isActive" : ""}`}
                    onClick={() => scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <div className="ts-arrows">
                <button className="ts-arrow" onClick={scrollPrev} aria-label="Previous">
                  ‹
                </button>
                <button className="ts-arrow" onClick={scrollNext} aria-label="Next">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="ts-carousel" ref={emblaRef}>
          <div className="ts-track">
            {terpeneCollections.map((c) => (
              <div className="ts-slide" key={c.id}>
                <CollectionCard
                  collection={c}
                  cart={cart}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  setCartQuantity={setCartQuantity}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Cart summary */}
        <div className="ts-cartSummary" style={{ marginTop: 32, background: 'rgba(255,255,255,0.85)', borderRadius: 12, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>Cart</h3>
          {Object.keys(cart).length === 0 ? (
            <div style={{ color: '#888', margin: '8px 0' }}>Your cart is empty.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0' }}>
              {Object.entries(cart).map(([profile, qty]) => (
                <li key={profile} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span>{profile}</span>
                  <span style={{ fontWeight: 700 }}>× {qty}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            className="ts-cta"
            style={{ marginTop: 12, width: '100%', maxWidth: 220, fontSize: 16 }}
            disabled={Object.keys(cart).length === 0}
            onClick={() => alert('Checkout coming soon!')}
          >
            Checkout
          </button>
        </div>

        <div className="ts-ctaRow">
          {heroCopy.ctas.map((t) => (
            <a
              key={t}
              className="ts-cta"
              href={t === "Contact Us Today" ? "#contact" : "#"}
              onClick={(e) => {
                if (t !== "Contact Us Today") e.preventDefault();
              }}
            >
              {t}
            </a>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}


function CollectionCard({ collection, cart, addToCart, removeFromCart, setCartQuantity }) {
  const [dropdownOpen, setDropdownOpen] = useState(null); // profile name or null
  const [qtyState, setQtyState] = useState({}); // { [profile-size]: quantity }

  const handleProfileClick = (profile) => {
    setDropdownOpen(dropdownOpen === profile ? null : profile);
  };

  const handleQtyChange = (profile, size, delta) => {
    const key = profile + ' - ' + size;
    setQtyState((prev) => {
      const newQty = Math.max(0, (prev[key] || 0) + delta);
      return { ...prev, [key]: newQty };
    });
  };

  const handleOptionAdd = (profile, size, price) => {
    const key = profile + ' - ' + size;
    const qty = qtyState[key] || 1;
    for (let i = 0; i < qty; i++) {
      addToCart(key);
    }
    setDropdownOpen(null);
    setQtyState((prev) => ({ ...prev, [key]: 1 })); // reset to 1 for next open
  };

  const options = [
    { size: '1g', price: 5 },
    { size: '5g', price: 10 },
    { size: '10g', price: 20 },
  ];

  return (
    <article className="ts-card">
      <div className="ts-cardLeft">
        <div className="ts-badge">{collection.badge}</div>
        <div className="ts-cardName">{collection.name}</div>
        {/* Add image below the collection name */}
        <img
          className="ts-cardImg"
          src={bottleImg}
          alt={collection.name + " bottle"}
        />
        <div className="ts-cardTagline">{collection.tagline}</div>
      </div>

      <div className="ts-cardRight">
        <div className="ts-profileHeader">Flavor Profiles</div>
        <br></br>
        <div className="ts-profileGrid" role="list">
          {collection.profiles.map((p) => (
            <div key={p} style={{ position: 'relative' }}>
              <button
                className="ts-profileBtn"
                type="button"
                onClick={() => handleProfileClick(p)}
                role="listitem"
              >
                {p}
              </button>
              {dropdownOpen === p && (
                <div className="ts-profileDropdown">
                  {options.map((opt) => {
                    const key = p + ' - ' + opt.size;
                    const qty = qtyState[key] || 1;
                    return (
                      <div key={opt.size} className="ts-profileDropdownOptionRow">
                        <span className="ts-profileDropdownLabel">{opt.size} - ${opt.price}</span>
                        <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, -1)} disabled={qty <= 1}>-</button>
                        <span className="ts-qtyNum">{qty}</span>
                        <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, 1)}>+</button>
                        <button className="ts-profileDropdownAddBtn" onClick={() => handleOptionAdd(p, opt.size, opt.price)}>
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <br></br> <br></br>
        <p className="ts-cardDesc">{collection.description}</p>
      </div>
    </article>
  );
}
