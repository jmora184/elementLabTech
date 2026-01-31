import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { heroCopy, terpeneCollections } from "./terpenesData";
import "./TerpeneShowcase.css";
import bottleImg from "../../assets/bottle.png";
import elementLabsLogo from "../../assets/ElementLabsLogos.png";
import cartIcon from "../../assets/cart.svg";
import { useIsMobile } from "./useIsMobile";

export default function TerpeneShowcase({ HeroBanner }) {
  const isMobile = useIsMobile();
  const [jumpToId, setJumpToId] = useState(terpeneCollections[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState({});
  // Refs for each collection card
  const cardRefs = useRef({});

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
    const id = e.target.value;
    setJumpToId(id);
    // Scroll to the card with the selected id
    setTimeout(() => {
      const ref = cardRefs.current[id];
      if (ref && ref.scrollIntoView) {
        ref.scrollIntoView({ behavior: "smooth", block: isMobile ? "start" : "center" });
      }
    }, 50);
  };
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Desktop content */}
      {!isMobile && (
        <>
          <header className="ts-siteHeader">
            <nav className="ts-siteNav" aria-label="Primary" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <a href="#" className="ts-logoLink" aria-label="Element Labs Home" onClick={(e) => e.preventDefault()}>
                <img src={elementLabsLogo} alt="Element Labs Logo" className="ts-siteLogo" />
              </a>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <div className="ts-jump" style={{ minWidth: 220 }}>
                  <select id="collectionJump" className="ts-select" value={jumpToId} onChange={onJumpChange}>
                    {terpeneCollections.map((c) => (
                      <option key={c.id} value={c.id}>{c.badge} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="ts-menuBtn"
                  type="button"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{marginRight: 8}}
                >
                  ☰
                </button>
              </div>
              <div className={`ts-navLinks ${menuOpen ? "isOpen" : ""}`} style={{display: 'flex', alignItems: 'center', gap: 0}}>
                <a href="#contact" className="ts-siteNavLink" onClick={closeMenu}>Contact</a>
                <a href="#network" className="ts-siteNavLink" onClick={closeMenu}>Network</a>
                <a href="#about" className="ts-siteNavLink" onClick={closeMenu}>About Us</a>
                <a href="#supply-chain" className="ts-siteNavLink" onClick={closeMenu}>Supply Chain</a>
                <button className="ts-cartIconBtn" type="button" aria-label="View cart" style={{background: 'none', border: 'none', position: 'relative', cursor: 'pointer', padding: 0, marginLeft: 16}}>
                  <img src={cartIcon} alt="Cart" style={{width: 28, height: 28, display: 'block'}} />
                  {Object.keys(cart).length > 0 && (
                    <span style={{position: 'absolute', top: -4, right: -4, background: '#ec4899', color: '#fff', borderRadius: '50%', fontSize: 12, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: '0 4px', border: '2px solid #fff'}}>
                      {Object.values(cart).reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
              </div>
            </nav>
          </header>
          {/* Mini header below main header */}
          <div style={{width: '100%', background: 'linear-gradient(90deg, #ede9fe 0%, #a78bfa 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0', gap: 32, fontWeight: 700, fontSize: 16, letterSpacing: '.04em', borderBottom: '1px solid #e9d5ff'}}>
            <a href="#terpenes" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 18px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Terpenes</a>
            <a href="#blends" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 18px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Blends</a>
            <a href="#isolates" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 18px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Isolates</a>
            <a href="#lines" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 18px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Lines</a>
          </div>
          {HeroBanner && <HeroBanner />}
          <section className="ts-section">
            <div className="ts-inner">
              {/* <div className="ts-header">
                <h2 className="ts-title">Terpenes By Element Labs</h2>
              </div> */}
              <div className="ts-desktopCardStack">
                {terpeneCollections.map((c, i) => {
                  let cardClass = '';
                  if (i === 0) cardClass = 'ts-card-lightblue';
                  else if (i === 1) cardClass = 'ts-card-green';
                  else if (i === 2) cardClass = 'ts-card-yellow';
                  else if (i === 3) cardClass = 'ts-card-blue';
                  else if (i === 4) cardClass = 'ts-card-orange';
                  return (
                    <div
                      key={c.id}
                      ref={el => { cardRefs.current[c.id] = el; }}
                      id={`card-${c.id}`}
                    >
                      <CollectionCard
                        collection={c}
                        cart={cart}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        setCartQuantity={setCartQuantity}
                        isMobile={false}
                        cardClass={cardClass}
                      />
                    </div>
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
            <nav className="ts-siteNav" aria-label="Primary" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <a href="#" className="ts-logoLink" aria-label="Element Labs Home" onClick={(e) => e.preventDefault()}>
                <img src={elementLabsLogo} alt="Element Labs Logo" className="ts-siteLogo" />
              </a>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <div className="ts-mobileJump" style={{ minWidth: 160 }}>
                  <select id="collectionJump" className="ts-mobileSelect" value={jumpToId} onChange={onJumpChange}>
                    {terpeneCollections.map((c) => (
                      <option key={c.id} value={c.id}>{c.badge} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="ts-menuBtn"
                  type="button"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{marginRight: 8}}
                >
                  ☰
                </button>
                <button className="ts-cartIconBtn" type="button" aria-label="View cart" style={{background: 'none', border: 'none', position: 'relative', cursor: 'pointer', padding: 0, marginRight: 8}}>
                  <img src={cartIcon} alt="Cart" style={{width: 28, height: 28, display: 'block'}} />
                  {Object.keys(cart).length > 0 && (
                    <span style={{position: 'absolute', top: -4, right: -4, background: '#ec4899', color: '#fff', borderRadius: '50%', fontSize: 12, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: '0 4px', border: '2px solid #fff'}}>
                      {Object.values(cart).reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
              </div>
              <div className={`ts-navLinks ${menuOpen ? "isOpen" : ""}`}> 
                <a href="#contact" className="ts-siteNavLink" onClick={closeMenu}>Contact</a>
                <a href="#network" className="ts-siteNavLink" onClick={closeMenu}>Network</a>
                <a href="#about" className="ts-siteNavLink" onClick={closeMenu}>About Us</a>
                <a href="#supply-chain" className="ts-siteNavLink" onClick={closeMenu}>Supply Chain</a>
              </div>
            </nav>
          </header>
          {/* Mini header below main header for mobile */}
          <div style={{width: '100%', background: 'linear-gradient(90deg, #ede9fe 0%, #a78bfa 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0', gap: 18, fontWeight: 700, fontSize: 15, letterSpacing: '.04em', borderBottom: '1px solid #e9d5ff'}}>
            <a href="#terpenes" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Terpenes</a>
            <a href="#blends" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Blends</a>
            <a href="#isolates" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Isolates</a>
            <a href="#lines" style={{color: '#7c3aed', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'background 0.15s'}} onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Lines</a>
          </div>
          {HeroBanner && <HeroBanner />}
          <div className="ts-mobileInner">
            {/* <div className="ts-mobileHeader">
              <h2 className="ts-mobileTitle">Terpenes By Element Labs</h2>
            </div> */}
            <div className="ts-mobileCardStack" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {terpeneCollections.map((c, i) => {
                let cardClass = '';
                if (i === 0) cardClass = 'ts-card-lightblue';
                else if (i === 1) cardClass = 'ts-card-green';
                else if (i === 2) cardClass = 'ts-card-yellow';
                else if (i === 3) cardClass = 'ts-card-blue';
                else if (i === 4) cardClass = 'ts-card-orange';
                return (
                  <div
                    key={c.id}
                    ref={el => { cardRefs.current[c.id] = el; }}
                    id={`card-${c.id}`}
                    style={{ width: '100%' }}
                  >
                    <CollectionCard
                      collection={c}
                      cart={cart}
                      addToCart={addToCart}
                      removeFromCart={removeFromCart}
                      setCartQuantity={setCartQuantity}
                      isMobile={true}
                      cardClass={cardClass}
                    />
                  </div>
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

function CollectionCard({ collection, isMobile, cardClass, addToCart }) {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState('2ml');
  const [selectedQty, setSelectedQty] = useState(1);
  return (
    <article className="ts-card"
      style={{
        minHeight: '500px',
        height: 'auto',
        background: '#fff',
        color: '#111',
        boxShadow: '0 2px 18px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}
    >
      <div className="ts-cardLeft">
        <div className="ts-badge" style={{ color: '#111', fontWeight: 900, paddingTop: '16px', textAlign: 'center', width: '100%' }}>{collection.badge}</div>
        <div className="ts-cardImgWrapper" style={{ position: 'relative', minHeight: '350px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            className="ts-cardImg"
            src={bottleImg}
            alt={collection.name + " bottle"}
            style={{ cursor: 'pointer', maxHeight: '100%', maxWidth: '90%', objectFit: 'contain', zIndex: 2, marginTop: '160px' }}
            onClick={() => navigate(`/product/${collection.id}`)}
          />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 3 }}>
            <div
              className="ts-cardNameOverlay"
              style={{
                background: '#fff',
                color: '#111',
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
                background: '#fff',
                color: '#111',
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
              <div style={{ width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <label htmlFor={`size-select-${collection.id}`} style={{ fontWeight: 600, fontSize: 15, marginRight: 8, color: '#111' }}>Size:</label>
                <select
                  id={`size-select-${collection.id}`}
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  style={{ fontSize: 15, padding: '6px 12px', borderRadius: 8, border: '1px solid #a78bfa', background: '#fff', color: '#111', fontWeight: 600 }}
                >
                  <option value="2ml">2 ml</option>
                  <option value="5ml">5 ml</option>
                  <option value="15ml">15 ml</option>
                </select>
                <label htmlFor={`qty-select-${collection.id}`} style={{ fontWeight: 600, fontSize: 15, marginLeft: 8, color: '#111' }}>Qty:</label>
                <select
                  id={`qty-select-${collection.id}`}
                  value={selectedQty}
                  onChange={e => setSelectedQty(Number(e.target.value))}
                  style={{ fontSize: 15, padding: '6px 12px', borderRadius: 8, border: '1px solid #a78bfa', background: '#fff', color: '#111', fontWeight: 600 }}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Removed ts-kicker for mobile */}
          </div>
        </div>
        <button
          className="ts-cta"
          style={isMobile
            ? { width: '80%', margin: '12px auto 0 auto', minWidth: 80, fontSize: 13, padding: '7px 12px', borderRadius: 10, background: '#7c3aed', color: '#fff', fontWeight: 700, border: 'none', boxShadow: '0 2px 8px rgba(124,58,237,0.10)', cursor: 'pointer', display: 'block', marginBottom: '18px' }
            : { width: '100%', margin: '18px auto 0 auto', minWidth: 120, fontSize: 16, padding: '10px 18px', borderRadius: 12, background: '#7c3aed', color: '#fff', fontWeight: 700, border: 'none', boxShadow: '0 2px 8px rgba(124,58,237,0.10)', cursor: 'pointer', display: 'block', marginBottom: '24px' }
          }
          onClick={() => {
            for (let i = 0; i < selectedQty; i++) {
              addToCart(`${collection.name} - ${selectedSize}`);
            }
          }}
        >
          Add to Cart
        </button>
      </div>
      {/* No flavor profiles shown here */}
    </article>
  );
}

