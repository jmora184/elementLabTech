import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { heroCopy, terpeneCollections } from "./terpenesData";
import "./TerpeneShowcase.css";
import bottleImg from "../../assets/bottle.png";
import elementLabsLogo from "../../assets/ElementLabsLogos.png";
import { useIsMobile } from "./useIsMobile";

export default function TerpeneShowcase({ HeroBanner }) {
  const isMobile = useIsMobile();
  const [jumpToId, setJumpToId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [miniMenuOpen, setMiniMenuOpen] = useState(false);
  // Refs for each collection card
  const cardRefs = useRef({});

  const addToCart = () => {};
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
  const displayedCollections = [...terpeneCollections, ...terpeneCollections.slice(0, 4)];

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
              </div>
            </nav>
          </header>
          {/* Mini header below main header */}
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
                          <button
                            key={label}
                            type="button"
                            className="ts-miniMenuItem"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="ts-miniMenuCol">
                        {miniMenuRight.map((label) => (
                          <button
                            key={label}
                            type="button"
                            className="ts-miniMenuItem"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="ts-miniLinks">
                <a href="#terpenes" className="ts-miniLink">Terpenes</a>
                <a href="#blends" className="ts-miniLink">Blends</a>
                <a href="#isolates" className="ts-miniLink">Isolates</a>
                <a href="#lines" className="ts-miniLink">Lines</a>
              </div>
            </div>
          </div>
          {HeroBanner && <HeroBanner />}
          <section className="ts-section">
            <div className="ts-inner">
              {/* <div className="ts-header">
                <h2 className="ts-title">Terpenes By Element Labs</h2>
              </div> */}
              <div className="ts-desktopCardStack">
                {displayedCollections.map((c, i) => {
                  const baseIndex = i % terpeneCollections.length;
                  const isOriginal = i < terpeneCollections.length;
                  let cardClass = '';
                  if (baseIndex === 0) cardClass = 'ts-card-lightblue';
                  else if (baseIndex === 1) cardClass = 'ts-card-green';
                  else if (baseIndex === 2) cardClass = 'ts-card-yellow';
                  else if (baseIndex === 3) cardClass = 'ts-card-blue';
                  else if (baseIndex === 4) cardClass = 'ts-card-orange';
                  return (
                    <div
                      key={`${c.id}-${i}`}
                      ref={isOriginal ? el => { cardRefs.current[c.id] = el; } : undefined}
                      id={isOriginal ? `card-${c.id}` : undefined}
                    >
                      <CollectionCard
                        collection={c}
                        addToCart={addToCart}
                        isMobile={false}
                        cardClass={cardClass}
                        cardIndex={baseIndex}
                      />
                    </div>
                  );
                })}
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
                <div className="ts-mobileJump" style={{ minWidth: 240, maxWidth: 280 }}>
                  <input
                    id="collectionJump"
                    className="ts-mobileSelect ts-mobileSelectSearch"
                    type="text"
                    value={jumpToId}
                    onChange={onJumpChange}
                    placeholder="Search"
                    aria-label="Search collections"
                  />
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
              {displayedCollections.map((c, i) => {
                const baseIndex = i % terpeneCollections.length;
                const isOriginal = i < terpeneCollections.length;
                let cardClass = '';
                if (baseIndex === 0) cardClass = 'ts-card-lightblue';
                else if (baseIndex === 1) cardClass = 'ts-card-green';
                else if (baseIndex === 2) cardClass = 'ts-card-yellow';
                else if (baseIndex === 3) cardClass = 'ts-card-blue';
                else if (baseIndex === 4) cardClass = 'ts-card-orange';
                return (
                  <div
                    key={`${c.id}-${i}`}
                    ref={isOriginal ? el => { cardRefs.current[c.id] = el; } : undefined}
                    id={isOriginal ? `card-${c.id}` : undefined}
                    style={{ width: '100%' }}
                  >
                    <CollectionCard
                      collection={c}
                      addToCart={addToCart}
                      isMobile={true}
                      cardClass={cardClass}
                      cardIndex={baseIndex}
                    />
                  </div>
                );
              })}
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

function CollectionCard({ collection, isMobile, cardClass, addToCart, cardIndex }) {
  const navigate = useNavigate();
  const primaryLabel =
    cardIndex === 0
      ? "Shop Now"
      : cardIndex === 2
      ? "Best Sellers"
      : cardIndex === 3
      ? "True to Plant"
      : "Strains";
  const secondaryLabel =
    cardIndex === 0
      ? "Request Samples"
      : cardIndex === 2
      ? "Formulators Choice"
      : cardIndex === 3
      ? "Full Spectrum"
      : "Crossovers";
  const [selectedType, setSelectedType] = useState(cardIndex === 1 ? "" : primaryLabel);
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
            style={{ cursor: 'pointer', maxHeight: '100%', maxWidth: '90%', objectFit: 'contain', zIndex: 2, marginTop: '80px' }}
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
            </div>
            {/* Removed ts-kicker for mobile */}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 110,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 30,
              zIndex: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedType(primaryLabel)}
              style={{
                fontSize: 14,
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid #111',
                background: '#fff',
                color: '#000',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType(secondaryLabel)}
              style={{
                fontSize: 14,
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid #111',
                background: '#fff',
                color: '#000',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {secondaryLabel}
            </button>
          </div>
        </div>
        <button
          className="ts-cta"
          style={isMobile
            ? { width: '80%', margin: '-26px auto 0 auto', minWidth: 80, fontSize: 13, padding: '7px 12px', borderRadius: 10, background: 'linear-gradient(135deg, #111 0%, #000 100%)', color: '#fff', fontWeight: 700, border: '1px solid #000', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer', display: 'block', marginBottom: '18px' }
            : { width: '100%', margin: '-22px auto 0 auto', minWidth: 120, fontSize: 16, padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #111 0%, #000 100%)', color: '#fff', fontWeight: 700, border: '1px solid #000', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer', display: 'block', marginBottom: '24px' }
          }
          onClick={() => {
            const label = selectedType || primaryLabel;
            addToCart(`${collection.name} - ${label}`);
          }}
        >
          {cardIndex === 3 ? "Explore HDT Botanicals" : "Explore Flavors"}
        </button>
      </div>
      {/* No flavor profiles shown here */}
    </article>
  );
}

