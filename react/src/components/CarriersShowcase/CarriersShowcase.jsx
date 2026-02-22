import React from "react";
import "../TerpeneShowcase/TerpeneShowcase.css";
import { useIsMobile } from "../TerpeneShowcase/useIsMobile";
import { useNavigate } from "react-router-dom";

import vaporImg from "../../assets/vapor.png";
import infusedFlowerImg from "../../assets/infusedflower.png";
import beverageImg from "../../assets/beverage.png";
import gummiesImg from "../../assets/gummies.png";

const MOCK_CARRIER_PRODUCTS = [
  {
    id: "carrier-mct-c8",
    name: "MCT C8 Carrier",
    tagline: "Neutral profile • Fast integration",
    imageSrc: vaporImg,
    productPath: "/product/fruity-fusion-forward",
  },
  {
    id: "carrier-hemp-seed",
    name: "Refined Hemp Seed Carrier",
    tagline: "Plant-forward base • Smooth finish",
    imageSrc: infusedFlowerImg,
    productPath: "/product/matrix-collection",
  },
  {
    id: "carrier-sunflower",
    name: "High-Purity Sunflower Carrier",
    tagline: "Clean mouthfeel • Stable blend",
    imageSrc: beverageImg,
    productPath: "/product/emerald-cut",
  },
  {
    id: "carrier-tri-blend",
    name: "Tri-Blend Carrier System",
    tagline: "Balanced viscosity • Broad compatibility",
    imageSrc: gummiesImg,
    productPath: "/product/test",
  },
];

export default function CarriersShowcase({ HeroBanner }) {
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && (
        <>
          {HeroBanner && <HeroBanner />}
          <section className="ts-section">
            <div className="ts-inner">
              <div className="ts-desktopCardStack">
                {MOCK_CARRIER_PRODUCTS.map((product, index) => (
                  <div key={`${product.id}-${index}`} id={`card-${product.id}`}>
                    <CarrierCard product={product} isMobile={false} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {isMobile && (
        <section className="ts-mobileSection ts-mobileMessage">
          {HeroBanner && <HeroBanner />}
          <div className="ts-mobileInner">
            <div className="ts-mobileCardStack" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {MOCK_CARRIER_PRODUCTS.map((product, index) => (
                <div key={`${product.id}-${index}`} id={`card-${product.id}`} style={{ width: "100%" }}>
                  <CarrierCard product={product} isMobile={true} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function CarrierCard({ product, isMobile }) {
  const navigate = useNavigate();

  return (
    <article
      className="ts-card"
      style={{
        minHeight: "500px",
        height: "auto",
        background: isMobile ? "transparent" : "#ffffff",
        color: "#111",
        boxShadow: isMobile ? "none" : "0 2px 18px rgba(0,0,0,0.08)",
        border: isMobile ? "none" : "1px solid #e5e7eb",
      }}
    >
      <div className="ts-cardLeft" style={{ background: isMobile ? "transparent" : "#ffffff" }}>
        <div
          className="ts-cardImgWrapper"
          style={{
            position: "relative",
            minHeight: "350px",
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: isMobile ? "transparent" : "#ffffff",
          }}
        >
          <img
            className="ts-cardImg"
            src={product.imageSrc}
            alt={product.name}
            style={{
              cursor: "pointer",
              maxHeight: isMobile ? "300%" : "225%",
              maxWidth: isMobile ? "180%" : "135%",
              objectFit: "contain",
              zIndex: 2,
              marginTop: "80px",
            }}
            onClick={() => navigate(product.productPath)}
          />

          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 3 }}>
            <div
              className="ts-cardNameOverlay"
              style={{
                background: "transparent",
                color: "#111",
                fontWeight: 800,
                fontSize: 18,
                padding: "10px 12px 2px 12px",
                textAlign: "center",
                letterSpacing: "-0.01em",
                boxSizing: "border-box",
                width: "100%",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto",
              }}
            >
              {product.name}
            </div>
            <div
              className="ts-cardTagline"
              style={{
                background: "transparent",
                color: "#111",
                fontWeight: 600,
                fontSize: 15,
                padding: "2px 12px 0px 12px",
                textAlign: "center",
                letterSpacing: "-0.01em",
                boxSizing: "border-box",
                width: "100%",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto",
              }}
            >
              {product.tagline}
            </div>
          </div>
        </div>

        <button
          className="ts-cta"
          style={
            isMobile
              ? {
                  width: "80%",
                  margin: "-26px auto 0 auto",
                  minWidth: 80,
                  fontSize: 13,
                  padding: "7px 12px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #111 0%, #000 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  border: "1px solid #000",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  cursor: "pointer",
                  display: "block",
                  marginBottom: "18px",
                  zIndex: 10,
                  position: "relative",
                }
              : {
                  width: "100%",
                  margin: "-22px auto 0 auto",
                  minWidth: 120,
                  fontSize: 16,
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #111 0%, #000 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  border: "1px solid #000",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  cursor: "pointer",
                  display: "block",
                  marginBottom: "24px",
                  zIndex: 10,
                  position: "relative",
                }
          }
          onClick={() => navigate(product.productPath)}
        >
          Explore Carriers
        </button>
      </div>
    </article>
  );
}
