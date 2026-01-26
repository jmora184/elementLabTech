import React, { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { heroCopy, terpeneCollections } from "./terpenesData";
import "./TerpeneShowcase.css";
import bottleImg from "../../assets/bottle.png";
import elementLabsLogo from "../../assets/ElementLabsLogos.png";
import { useIsMobile } from "./useIsMobile";

/**
 * TerpeneShowcase
 * - Abstrax-style purple/yellow section
 * - Centered card carousel w/ dots + arrows
 * - Dropdown to jump to a collection
 *
 * Install deps:
 *   npm i embla-carousel embla-carousel-react
 */

export default function TerpeneShowcase() {
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    skipSnaps: false,
    dragFree: false,
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [jumpToId, setJumpToId] = useState(terpeneCollections[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);

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

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Desktop content: only visible if not mobile */}
      {!isMobile && (
        <>
          <header className="ts-siteHeader">
            <nav className="ts-siteNav" aria-label="Primary">
              <a href="#" className="ts-logoLink" aria-label="Element Labs Home" onClick={(e) => e.preventDefault()}>
                <img src={elementLabsLogo} alt="Element Labs Logo" className="ts-siteLogo" />
              </a>

              <button
                className="ts-menuBtn"
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                ☰
              </button>

              <div className={`ts-navLinks ${menuOpen ? "isOpen" : ""}`}>
                <a href="#contact" className="ts-siteNavLink" onClick={closeMenu}>
                  Contact
                </a>
                <a href="#network" className="ts-siteNavLink" onClick={closeMenu}>
                  Network
                </a>
                <a href="#about" className="ts-siteNavLink" onClick={closeMenu}>
                  About Us
                </a>
                <a href="#supply-chain" className="ts-siteNavLink" onClick={closeMenu}>
                  Supply Chain
                </a>
              </div>
            </nav>
          </header>

          <section className="ts-section">
            <div className="ts-inner">
              <div className="ts-header">
                <h2 className="ts-title">Terpenes By Element Labs</h2>

                <div className="ts-controls">
                  <div className="ts-jump">
                    <label className="ts-jumpLabel" htmlFor="collectionJump">
                      Shop Terpene Collections
                    </label>
                    <select id="collectionJump" className="ts-select" value={jumpToId} onChange={onJumpChange}>
                      {terpeneCollections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.badge} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ts-nav">
                    <div className="ts-dots" aria-label="Carousel page indicators">
                      {Array.from({ length: snapCount }).map((_, i) => (
                        <button
                          key={i}
                          className={`ts-dot ${i === selectedIndex ? "isActive" : ""}`}
                          onClick={() => scrollTo(i)}
                          aria-label={`Go to slide ${i + 1}`}
                          type="button"
                        />
                      ))}
                    </div>

                    <div className="ts-arrows">
                      <button className="ts-arrow" onClick={scrollPrev} aria-label="Previous" type="button">
                        ‹
                      </button>
                      <button className="ts-arrow" onClick={scrollNext} aria-label="Next" type="button">
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
              <div className="ts-cartSummary">
                <h3 style={{ margin: 0, fontSize: 20 }}>Cart</h3>
                {Object.keys(cart).length === 0 ? (
                  <div style={{ color: "#666", margin: "8px 0" }}>Your cart is empty.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                    {Object.entries(cart).map(([profile, qty]) => (
                      <li
                        key={profile}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                          gap: 10,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <span>{profile}</span>
                        <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>× {qty}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  className="ts-cta"
                  style={{ marginTop: 12, width: "100%", maxWidth: 260, fontSize: 16 }}
                  disabled={Object.keys(cart).length === 0}
                  onClick={() => alert("Checkout coming soon!")}
                  type="button"
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
      )}
      {/* Mobile content: only visible if mobile */}
      {isMobile && (
        <section className="ts-mobileSection ts-mobileMessage">
          <header className="ts-siteHeader">
            <nav className="ts-siteNav" aria-label="Primary">
              <a href="#" className="ts-logoLink" aria-label="Element Labs Home" onClick={(e) => e.preventDefault()}>
                <img src={elementLabsLogo} alt="Element Labs Logo" className="ts-siteLogo" />
              </a>
              <button
                className="ts-menuBtn"
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                ☰
              </button>
              <div className={`ts-navLinks ${menuOpen ? "isOpen" : ""}`}>
                <a href="#contact" className="ts-siteNavLink" onClick={closeMenu}>Contact</a>
                <a href="#network" className="ts-siteNavLink" onClick={closeMenu}>Network</a>
                <a href="#about" className="ts-siteNavLink" onClick={closeMenu}>About Us</a>
                <a href="#supply-chain" className="ts-siteNavLink" onClick={closeMenu}>Supply Chain</a>
              </div>
            </nav>
          </header>
          <section className="ts-mobileSection">
            <div className="ts-mobileInner">
              <div className="ts-mobileHeader">
                <h2 className="ts-mobileTitle">Terpenes By Element Labs</h2>
                <div className="ts-mobileControls">
                  <div className="ts-mobileJump">
                    <label className="ts-mobileJumpLabel" htmlFor="collectionJump">
                      Shop Terpene Collections
                    </label>
                    <select id="collectionJump" className="ts-mobileSelect" value={jumpToId} onChange={onJumpChange}>
                      {terpeneCollections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.badge} — {c.name}
                        </option>
                      ))}
                    </select>
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
                        isMobile={isMobile}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart summary */}
              <div className="ts-cartSummary">
                <h3 style={{ margin: 0, fontSize: 20 }}>Cart</h3>
                {Object.keys(cart).length === 0 ? (
                  <div style={{ color: "#666", margin: "8px 0" }}>Your cart is empty.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                    {Object.entries(cart).map(([profile, qty]) => (
                      <li
                        key={profile}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                          gap: 10,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <span>{profile}</span>
                        <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>× {qty}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  className="ts-cta"
                  style={{ marginTop: 12, width: "100%", maxWidth: 260, fontSize: 16 }}
                  disabled={Object.keys(cart).length === 0}
                  onClick={() => alert("Checkout coming soon!")}
                  type="button"
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
        </section>
      )}
    </>
  );
}

function CollectionCard({ collection, cart, addToCart, removeFromCart, setCartQuantity, isMobile }) {
  const [dropdownOpen, setDropdownOpen] = useState(null); // profile name or null
  const [qtyState, setQtyState] = useState({}); // { [profile-size]: quantity }
  const [showProfilePopup, setShowProfilePopup] = useState(false); // for mobile popup

  const handleProfileClick = (profile) => {
    setDropdownOpen(dropdownOpen === profile ? null : profile);
  };

  const handleQtyChange = (profile, size, delta) => {
    const key = profile + " - " + size;
    setQtyState((prev) => {
      const newQty = Math.max(1, (prev[key] || 1) + delta);
      return { ...prev, [key]: newQty };
    });
  };

  const handleOptionAdd = (profile, size) => {
    const key = profile + " - " + size;
    const qty = qtyState[key] || 1;
    for (let i = 0; i < qty; i++) addToCart(key);
    setDropdownOpen(null);
  };

  const options = [
    { size: "1g", price: 5 },
    { size: "5g", price: 10 },
    { size: "10g", price: 20 },
  ];

  return (
    <article className="ts-card">
      <div className="ts-cardLeft">
        <div className="ts-badge">{collection.badge}</div>
        <div className="ts-cardImgWrapper" style={{ position: 'relative' }}>
          <img
            className="ts-cardImg"
            src={bottleImg}
            alt={collection.name + " bottle"}
            onClick={isMobile ? () => setShowProfilePopup(true) : undefined}
            style={isMobile ? { cursor: 'pointer' } : {}}
          />
          {/* Name and tagline overlays at top of image */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 3 }}>
            <div className="ts-cardNameOverlay" style={{
              background: 'rgba(40,0,80,0.82)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
              padding: '10px 12px 2px 12px',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              textAlign: 'center',
              letterSpacing: '-0.01em',
              boxSizing: 'border-box',
            }}>{collection.name}</div>
            <div className="ts-cardTagline" style={{
              background: 'rgba(40,0,80,0.68)',
              color: '#ffe066',
              fontWeight: 600,
              fontSize: 15,
              padding: '2px 12px 6px 12px',
              textAlign: 'center',
              letterSpacing: '-0.01em',
              boxSizing: 'border-box',
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}>{collection.tagline}</div>
          </div>
          <div className="ts-cardDescOverlay">
            {collection.description}
          </div>
        </div>
      </div>
      <div className="ts-cardRight">
        <br></br>
        <br></br>
        <div className="ts-kicker">{heroCopy.eyebrow}</div>
        <div className="ts-profileHeader">{collection.name} Flavor Profiles</div>
        <br></br>
        {/* Only show profile grid inline on desktop, on mobile use popup */}
        {!isMobile && (
          <div className="ts-profileGrid" role="list">
            {collection.profiles.map((p) => (
              <div key={p} style={{ position: "relative" }}>
                <button className="ts-profileBtn" type="button" onClick={() => handleProfileClick(p)} role="listitem">
                  {p}
                </button>
                {dropdownOpen === p && (
                  <div className="ts-profileDropdown">
                    {options.map((opt) => {
                      const key = p + " - " + opt.size;
                      const qty = qtyState[key] || 1;
                      return (
                        <div key={opt.size} className="ts-profileDropdownOptionRow">
                          <span className="ts-profileDropdownLabel">
                            {opt.size} — ${opt.price}
                          </span>
                          <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, -1)} type="button">
                            -
                          </button>
                          <span className="ts-qtyNum">{qty}</span>
                          <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, 1)} type="button">
                            +
                          </button>
                          <button className="ts-profileDropdownAddBtn" onClick={() => handleOptionAdd(p, opt.size)} type="button">
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
        )}
        {/* Mobile popup for flavor profiles */}
        {isMobile && showProfilePopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
            onClick={() => setShowProfilePopup(false)}
          >
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              minWidth: 260,
              maxWidth: 340,
              width: '90vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              position: 'relative',
            }}
              onClick={e => e.stopPropagation()}
            >
              <button
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 12,
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#888',
                }}
                aria-label="Close"
                onClick={() => setShowProfilePopup(false)}
              >
                ×
              </button>
              <div className="ts-profileHeader" style={{ marginBottom: 12 }}>{collection.name} Flavor Profiles</div>
              <div className="ts-profileGrid" role="list">
                {collection.profiles.map((p) => (
                  <div key={p} style={{ position: "relative" }}>
                    <button className="ts-profileBtn" type="button" onClick={() => handleProfileClick(p)} role="listitem">
                      {p}
                    </button>
                    {dropdownOpen === p && (
                      <div className="ts-profileDropdown">
                        {options.map((opt) => {
                          const key = p + " - " + opt.size;
                          const qty = qtyState[key] || 1;
                          return (
                            <div key={opt.size} className="ts-profileDropdownOptionRow">
                              <span className="ts-profileDropdownLabel">
                                {opt.size} — ${opt.price}
                              </span>
                              <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, -1)} type="button">
                                -
                              </button>
                              <span className="ts-qtyNum">{qty}</span>
                              <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, 1)} type="button">
                                +
                              </button>
                              <button className="ts-profileDropdownAddBtn" onClick={() => handleOptionAdd(p, opt.size)} type="button">
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
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
