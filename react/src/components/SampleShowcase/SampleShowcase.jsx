import React, { useEffect, useMemo, useState } from "react";
import "../TerpeneShowcase/TerpeneShowcase.css";
import { useIsMobile } from "../TerpeneShowcase/useIsMobile";
import { useNavigate } from "react-router-dom";

export default function SampleShowcase({ HeroBanner }) {
  const isMobile = useIsMobile();
  const [dbCollections, setDbCollections] = useState([]);

  async function fetchJson(url, opts) {
    const res = await fetch(url, { credentials: "include", ...opts });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const msg = data?.error || data?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  useEffect(() => {
    fetchJson("/api/collections")
      .then((d) => setDbCollections(Array.isArray(d?.collections) ? d.collections : []))
      .catch(() => setDbCollections([]));
  }, []);

  const displayedCollections = useMemo(() => {
    const byId = new Map((dbCollections || []).map((c) => [String(c?.id || ""), c]));
    const defs = [
      {
        id: "sample-set-amplify",
        collectionId: "fruity-fusion-forward",
        name: "Amplify Sample",
        tagline: "4 Flavor Profiles",
      },
      {
        id: "sample-set-matrix",
        collectionId: "matrix-collection",
        name: "Matrix Sample",
        tagline: "4 Flavor Profiles",
      },
      {
        id: "sample-set-benchmark",
        collectionId: "test",
        name: "Benchmark Sample",
        tagline: "4 Flavor Profiles",
      },
      {
        id: "sample-set-emerald",
        collectionId: "emerald-cut",
        name: "Emerald Sample",
        tagline: "4 Flavor Profiles",
      },
    ];

    return defs.map((d) => {
      const base = byId.get(d.collectionId) || {};
      return {
        ...base,
        id: d.id,
        name: d.name,
        tagline: d.tagline,
        productPath: `/product/${d.collectionId}`,
      };
    });
  }, [dbCollections]);

  return (
    <>
      {!isMobile && (
        <>
          {HeroBanner && <HeroBanner />}
          <section className="ts-section">
            <div className="ts-inner">
              <div className="ts-desktopCardStack">
                {displayedCollections.map((c, i) => {
                  const cardClasses = [
                    "ts-card-lightblue",
                    "ts-card-green",
                    "ts-card-yellow",
                    "ts-card-blue",
                    "ts-card-orange",
                  ];
                  const baseIndex = cardClasses.length ? i % cardClasses.length : 0;
                  const cardClass = cardClasses[baseIndex] || "";
                  return (
                    <div key={`${c.id}-${i}`} id={c?.id ? `card-${c.id}` : undefined}>
                      <SampleCollectionCard
                        collection={c}
                        isMobile={false}
                        cardClass={cardClass}
                      />
                    </div>
                  );
                })}
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
              {displayedCollections.map((c, i) => {
                const cardClasses = [
                  "ts-card-lightblue",
                  "ts-card-green",
                  "ts-card-yellow",
                  "ts-card-blue",
                  "ts-card-orange",
                ];
                const baseIndex = cardClasses.length ? i % cardClasses.length : 0;
                const cardClass = cardClasses[baseIndex] || "";
                return (
                  <div key={`${c.id}-${i}`} id={c?.id ? `card-${c.id}` : undefined} style={{ width: "100%" }}>
                    <SampleCollectionCard
                      collection={c}
                      isMobile={true}
                      cardClass={cardClass}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function getCollectionImageUrl(collection) {
  let cardImageSrc = "";
  try {
    const raw = collection?.images_json;
    const arr = Array.isArray(raw) ? raw : raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr) && arr.length) {
      const primary = arr.find((r) => !!r?.isPrimary && typeof r?.url === "string" && r.url.trim());
      const first = arr.find((r) => typeof r?.url === "string" && r.url.trim());
      const url = (primary?.url || first?.url || "").trim();
      if (url) cardImageSrc = url;
    }
  } catch {
    // ignore
  }
  return cardImageSrc;
}

function SampleCollectionCard({ collection, isMobile }) {
  const navigate = useNavigate();
  const productPath = String(collection?.productPath || `/product/${collection?.id || ""}`);
  const cardImageSrc = getCollectionImageUrl(collection);

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
          {cardImageSrc && (
            <img
              className="ts-cardImg"
              src={cardImageSrc}
              alt={collection.name + " bottle"}
              style={{
                cursor: "pointer",
                maxHeight: isMobile ? "300%" : "225%",
                maxWidth: isMobile ? "180%" : "135%",
                objectFit: "contain",
                zIndex: 2,
                marginTop: "80px",
              }}
              onClick={() => navigate(productPath)}
            />
          )}

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
              {collection.name}
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
              {collection.tagline}
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
          onClick={() => {
            if (productPath && productPath !== "/product/") {
              navigate(productPath);
            }
          }}
        >
          Buy for $199
        </button>
      </div>
    </article>
  );
}
