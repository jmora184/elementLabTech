import React, { useState } from "react";
import { heroCopy, terpeneCollections } from "./terpenesData";
import "./TerpeneShowcase.css";
import bottleImg from "../../assets/bottle.png";
import { useIsMobile } from "./useIsMobile";
import { useNavigate } from "react-router-dom";
import TerpeneSimulator from "../TerpeneSimulator/TerpeneSimulator";
// Header is provided globally by SiteLayout.

export default function TerpeneShowcase({ HeroBanner }) {
  const isMobile = useIsMobile();
  

  const addToCart = () => {};
  const displayedCollections = terpeneCollections;

  return (
    <>
      {/* Desktop content */}
      {!isMobile && (
        <>
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
              {/* Terpene Simulator section (desktop) */}
              <TerpeneSimulator />
            </div>
          </section>
        </>
      )}
      {/* Mobile content */}
      {isMobile && (
        <section className="ts-mobileSection ts-mobileMessage">
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
            {/* Terpene Simulator section (mobile) */}
            <TerpeneSimulator />
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

