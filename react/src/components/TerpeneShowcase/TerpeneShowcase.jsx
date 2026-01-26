import React, { useState } from "react";
import { heroCopy, terpeneCollections } from "./terpenesData";
import "./TerpeneShowcase.css";
import bottleImg from "../../assets/bottle.png";
import elementLabsLogo from "../../assets/ElementLabsLogos.png";
import { useIsMobile } from "./useIsMobile";

export default function TerpeneShowcase() {
  const isMobile = useIsMobile();
  const [jumpToId, setJumpToId] = useState(terpeneCollections[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
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
  const onJumpChange = (e) => {
    setJumpToId(e.target.value);
  };
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Desktop content */}
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
                <a href="#contact" className="ts-siteNavLink" onClick={closeMenu}>Contact</a>
                <a href="#network" className="ts-siteNavLink" onClick={closeMenu}>Network</a>
                <a href="#about" className="ts-siteNavLink" onClick={closeMenu}>About Us</a>
                <a href="#supply-chain" className="ts-siteNavLink" onClick={closeMenu}>Supply Chain</a>
              </div>
            </nav>
          </header>
          <section className="ts-section">
            <div className="ts-inner">
              <div className="ts-header">
                <h2 className="ts-title">Terpenes By Element Labs</h2>
                <div className="ts-controls">
                  <div className="ts-jump">
                    <label className="ts-jumpLabel" htmlFor="collectionJump">Shop Terpene Collections</label>
                    <select id="collectionJump" className="ts-select" value={jumpToId} onChange={onJumpChange}>
                      {terpeneCollections.map((c) => (
                        <option key={c.id} value={c.id}>{c.badge} — {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="ts-desktopCardStack">
                {terpeneCollections.map((c, i) => {
                  let cardClass = '';
                  if (i === 0) cardClass = 'ts-card-lightblue';
                  else if (i === 1) cardClass = 'ts-card-green';
                  else if (i === 2) cardClass = 'ts-card-yellow';
                  else if (i === 3) cardClass = 'ts-card-blue';
                  else if (i === 4) cardClass = 'ts-card-orange';
                  return (
                    <CollectionCard
                      key={c.id}
                      collection={c}
                      cart={cart}
                      addToCart={addToCart}
                      removeFromCart={removeFromCart}
                      setCartQuantity={setCartQuantity}
                      isMobile={false}
                      cardClass={cardClass}
                    />
                  );
                })}
              </div>
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
      {/* Mobile content */}
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
          <div className="ts-mobileInner">
            <div className="ts-mobileHeader">
              <h2 className="ts-mobileTitle">Terpenes By Element Labs</h2>
              <div className="ts-mobileControls">
                <div className="ts-mobileJump">
                  <label className="ts-mobileJumpLabel" htmlFor="collectionJump">Shop Terpene Collections</label>
                  <select id="collectionJump" className="ts-mobileSelect" value={jumpToId} onChange={onJumpChange}>
                    {terpeneCollections.map((c) => (
                      <option key={c.id} value={c.id}>{c.badge} — {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="ts-mobileCardStack">
              {terpeneCollections.map((c, i) => {
                let cardClass = '';
                if (i === 0) cardClass = 'ts-card-lightblue';
                else if (i === 1) cardClass = 'ts-card-green';
                else if (i === 2) cardClass = 'ts-card-yellow';
                else if (i === 3) cardClass = 'ts-card-blue';
                else if (i === 4) cardClass = 'ts-card-orange';
                return (
                  <CollectionCard
                    key={c.id}
                    collection={c}
                    cart={cart}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    setCartQuantity={setCartQuantity}
                    isMobile={true}
                    cardClass={cardClass}
                  />
                );
              })}
            </div>
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
      )}
    </>
  );
}

function CollectionCard({ collection, cart, addToCart, removeFromCart, setCartQuantity, isMobile, cardClass }) {
  const [dropdownOpen, setDropdownOpen] = React.useState(null);
  const [qtyState, setQtyState] = React.useState({});
  const options = [
    { size: "1g", price: 5 },
    { size: "5g", price: 10 },
    { size: "10g", price: 20 },
  ];

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

  // Button style logic
  const getBtnStyle = () => {
    if (isMobile) {
      return {
        fontSize: 12,
        padding: '2px 6px',
        borderRadius: 7,
        minWidth: 0,
        maxWidth: '38vw',
        height: 'auto',
        margin: '1px 0 1px 0',
        transform: 'scale(0.85)',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
      };
    } else {
      return {
        padding: 0, // Remove padding inside button
        fontSize: 15,
        borderRadius: 12,
        minWidth: 0,
        maxWidth: '100%',
        height: '44px',
        margin: '8px 8px',
        fontWeight: 800,
        wordBreak: 'break-word',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
    }
  };

  return (
                    <article
                      className={`ts-card${cardClass ? ' ' + cardClass : ''}`}
                      style={
                        cardClass === 'ts-card-lightblue'
                          ? {
                              background: 'linear-gradient(135deg, #e0f7fa 0%, #90cdf4 100%)',
                              boxShadow: '0 2px 18px rgba(144,205,244,0.18)',
                              border: '1px solid #90cdf4',
                            }
                          : undefined
                      }
                    >
                      <div className="ts-cardLeft">
                        <div className="ts-badge">{collection.badge}</div>
                        <div className="ts-cardImgWrapper" style={{ position: 'relative' }}>
                          <img
                            className="ts-cardImg"
                            src={bottleImg}
                            alt={collection.name + " bottle"}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 3 }}>
                            <div
                              className="ts-cardNameOverlay"
                              style={{
                                background:
                                  cardClass === 'ts-card-green'
                                    ? 'linear-gradient(90deg, #b7f8b7 0%, #6ee7b7 100%)'
                                    : cardClass === 'ts-card-yellow'
                                    ? 'linear-gradient(90deg, #fffbe6 0%, #ffe066 100%)'
                                    : cardClass === 'ts-card-blue'
                                    ? 'linear-gradient(90deg, #e0f7fa 0%, #90cdf4 100%)'
                                    : cardClass === 'ts-card-orange'
                                    ? 'linear-gradient(90deg, #fff5e6 0%, #ffd699 100%)'
                                    : 'rgba(40,0,80,0.82)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: 18,
                                padding: '10px 12px 2px 12px',
                                borderTopLeftRadius: 16,
                                borderTopRightRadius: 16,
                                textAlign: 'center',
                                letterSpacing: '-0.01em',
                                boxSizing: 'border-box',
                              }}
                            >
                              {collection.name}
                            </div>
                            <div
                              className="ts-cardTagline"
                              style={{
                                background:
                                  cardClass === 'ts-card-green'
                                    ? 'linear-gradient(90deg, #b7f8b7 0%, #6ee7b7 100%)'
                                    : cardClass === 'ts-card-yellow'
                                    ? 'linear-gradient(90deg, #fffbe6 0%, #ffe066 100%)'
                                    : cardClass === 'ts-card-blue'
                                    ? 'linear-gradient(90deg, #e0f7fa 0%, #90cdf4 100%)'
                                    : cardClass === 'ts-card-orange'
                                    ? 'linear-gradient(90deg, #fff5e6 0%, #ffd699 100%)'
                                    : 'rgba(40,0,80,0.68)',
                                color: '#ffe066',
                                fontWeight: 600,
                                fontSize: 15,
                                padding: '2px 12px 6px 12px',
                                textAlign: 'center',
                                letterSpacing: '-0.01em',
                                boxSizing: 'border-box',
                                borderBottomLeftRadius: 12,
                                borderBottomRightRadius: 12,
                              }}
                            >
                              {collection.tagline}
                            </div>
                            {isMobile && (
                              <div className="ts-kicker ts-kicker-mobile" style={{
                                marginTop: 0,
                                position: 'relative',
                                left: '33%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(255,255,255,.35)',
                                color: '#6d28d9',
                                fontWeight: 900,
                                fontSize: 14,
                                borderRadius: 999,
                                padding: '4px 10px',
                                textAlign: 'center',
                                zIndex: 4,
                                maxWidth: '90%',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                              }}>{heroCopy.eyebrow}</div>
                            )}
                          </div>
                          <div className="ts-cardDescOverlay">
                            {collection.description}
                          </div>
                        </div>
                      </div>
                      <div className={isMobile ? "ts-cardRight ts-cardRight-mobile" : "ts-cardRight"}>
                        {!isMobile && (
                          <>
                            <br /><br />
                            <div className="ts-kicker">{heroCopy.eyebrow}</div>
                            <div
                              className="ts-profileHeader"
                              style={{
                                marginTop: '8px',
                                width: '100%',
                                marginLeft: 0,
                                marginRight: 0,
                                boxSizing: 'border-box',
                                background:
                                  cardClass === 'ts-card-lightblue'
                                    ? 'linear-gradient(90deg, #e0f7fa 0%, #90cdf4 100%)'
                                    : cardClass === 'ts-card-green'
                                    ? 'linear-gradient(90deg, #b7f8b7 0%, #6ee7b7 100%)'
                                    : cardClass === 'ts-card-yellow'
                                    ? 'linear-gradient(90deg, #fffbe6 0%, #ffe066 100%)'
                                    : cardClass === 'ts-card-blue'
                                    ? 'linear-gradient(90deg, #e0f7fa 0%, #90cdf4 100%)'
                                    : cardClass === 'ts-card-orange'
                                    ? 'linear-gradient(90deg, #fff5e6 0%, #ffd699 100%)'
                                    : undefined,
                                color:
                                  cardClass === 'ts-card-yellow' || cardClass === 'ts-card-orange'
                                    ? '#6d28d9'
                                    : '#166534',
                                fontWeight: 800,
                                fontSize: 17,
                                padding: '10px 12px',
                                borderRadius: 12,
                                textAlign: 'center',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {collection.name} Flavor Profiles
                            </div>
                          </>
                        )}
                        {isMobile && (
                          <>
                            <div
                              className="ts-profileHeader"
                              style={{
                                marginTop: '8px',
                                width: '100%',
                                marginLeft: 0,
                                marginRight: 0,
                                boxSizing: 'border-box',
                                background:
                                  cardClass === 'ts-card-lightblue'
                                    ? 'linear-gradient(90deg, #e0f7fa 0%, #90cdf4 100%)'
                                    : cardClass === 'ts-card-green'
                                    ? 'linear-gradient(90deg, #b7f8b7 0%, #6ee7b7 100%)'
                                    : cardClass === 'ts-card-yellow'
                                    ? 'linear-gradient(90deg, #fffbe6 0%, #ffe066 100%)'
                                    : cardClass === 'ts-card-blue'
                                    ? 'linear-gradient(90deg, #e0f7fa 0%, #90cdf4 100%)'
                                    : cardClass === 'ts-card-orange'
                                    ? 'linear-gradient(90deg, #fff5e6 0%, #ffd699 100%)'
                                    : undefined,
                                color:
                                  cardClass === 'ts-card-yellow' || cardClass === 'ts-card-orange'
                                    ? '#6d28d9'
                                    : '#166534',
                                fontWeight: 800,
                                fontSize: 17,
                                padding: '10px 12px',
                                borderRadius: 12,
                                textAlign: 'center',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {collection.name} Flavor Profiles
                            </div>
                          </>
                        )}
                        <br />
                        <div
                          className="ts-profileGrid"
                          role="list"
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: isMobile ? '0px' : '16px', // Add gap for desktop only
                            width: '97%',
                            boxSizing: 'border-box',
                          }}
                        >
                          {collection.profiles.map((p) => {
                            const isLong = p.length > 16;
                            let btnColorClass = '';
                            if (cardClass === 'ts-card-green') btnColorClass = 'ts-profileBtn-green';
                            else if (cardClass === 'ts-card-yellow') btnColorClass = 'ts-profileBtn-yellow';
                            else if (cardClass === 'ts-card-light') btnColorClass = 'ts-profileBtn-light';
                            return (
                              <div key={p} style={{ position: 'relative' }}>
                                <button
                                  className={`ts-profileBtn${isLong ? ' long-name' : ''}${btnColorClass ? ' ' + btnColorClass : ''}`}
                                  type="button"
                                  onClick={() => handleProfileClick(p)}
                                  role="listitem"
                                  title={p}
                                  style={getBtnStyle()}
                                >
                                  {p}
                                </button>
                                {dropdownOpen === p ? (
                                  isMobile ? (
                                    <React.Fragment>
                                      <div
                                        style={{
                                          position: 'fixed',
                                          top: 0,
                                          left: 0,
                                          width: '100vw',
                                          height: '100vh',
                                          background: 'rgba(0,0,0,0.18)',
                                          zIndex: 1000,
                                        }}
                                        onClick={() => setDropdownOpen(null)}
                                      />
                                      <div
                                        className="ts-profileDropdown"
                                        style={{
                                          position: 'fixed',
                                          top: '50%',
                                          left: '50%',
                                          transform: 'translate(-50%, -50%)',
                                          minWidth: 240,
                                          maxWidth: '90vw',
                                          background: '#fff',
                                          boxShadow: '0 2px 18px rgba(0,0,0,0.18)',
                                          borderRadius: 16,
                                          zIndex: 1001,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          padding: '18px 12px',
                                        }}
                                      >
                                        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10, color: '#6d28d9', textAlign: 'center', wordBreak: 'break-word' }}>{p}</div>
                                        {options.map((opt) => {
                                          const key = p + ' - ' + opt.size;
                                          const qty = qtyState[key] || 1;
                                          return (
                                            <div key={opt.size} className="ts-profileDropdownOptionRow" style={{ justifyContent: 'center', width: '100%' }}>
                                              <span className="ts-profileDropdownLabel">
                                                {opt.size} — ${opt.price}
                                              </span>
                                              <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, -1)} type="button">-</button>
                                              <span className="ts-qtyNum">{qty}</span>
                                              <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, 1)} type="button">+</button>
                                              <button className="ts-profileDropdownAddBtn" onClick={() => handleOptionAdd(p, opt.size)} type="button">Add</button>
                                            </div>
                                          );
                                        })}
                                        <button
                                          style={{ marginTop: 12, fontSize: 15, borderRadius: 10, padding: '8px 18px', background: '#eee', color: '#333', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                          onClick={() => setDropdownOpen(null)}
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </React.Fragment>
                                  ) : (
                                    <div className="ts-profileDropdown">
                                      {options.map((opt) => {
                                        const key = p + ' - ' + opt.size;
                                        const qty = qtyState[key] || 1;
                                        return (
                                          <div key={opt.size} className="ts-profileDropdownOptionRow">
                                            <span className="ts-profileDropdownLabel">
                                              {opt.size} — ${opt.price}
                                            </span>
                                            <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, -1)} type="button">-</button>
                                            <span className="ts-qtyNum">{qty}</span>
                                            <button className="ts-qtyBtn" onClick={() => handleQtyChange(p, opt.size, 1)} type="button">+</button>
                                            <button className="ts-profileDropdownAddBtn" onClick={() => handleOptionAdd(p, opt.size)} type="button">Add</button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  );
}

