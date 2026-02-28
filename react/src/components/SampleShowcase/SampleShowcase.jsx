import React, { useEffect, useMemo, useState } from "react";
import "../TerpeneShowcase/TerpeneShowcase.css";
import "./SampleShowcase.css";
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
        name: "Amplify Samples",
        collectionName: "Fruit Collection",
        tagline: "2mL × 10 Flavors ",
        vibe: "Fruity • Bright • Loud",
      },
      {
        id: "sample-set-matrix",
        collectionId: "matrix-collection",
        name: "Matrix Sample",
        tagline: "2mL × 10 Flavors",
        vibe: "Complex • Layered • Modern",
      },
      {
        id: "sample-set-benchmark",
        collectionId: "test",
        name: "Benchmark Sample",
        tagline: "2mL × 10 Flavors",
        vibe: "Classic • Balanced • Reliable",
      },
      {
        id: "sample-set-emerald",
        collectionId: "emerald-cut",
        name: "Emerald Sample",
        tagline: "2mL × 10 Flavors",
        vibe: "Fresh • Clean • Elevated",
      },
    ];

    return defs.map((d) => {
      const base = byId.get(d.collectionId) || {};
      return {
        ...base,
        id: d.id,
        name: d.name,
        tagline: d.tagline,
        vibe: d.vibe,
        collectionId: d.collectionId,
        collectionName: d.collectionName,
      };
    });
  }, [dbCollections]);

  return (
    <div className="ss-page">
      {HeroBanner && <HeroBanner />}

      <section className="ss-hero">
        <div className="ss-heroInner">
          <div className="ss-heroCopy">
            <div className="ss-kicker">Sample Kits</div>
            <div className="ss-topline" style={{ fontSize: 18, fontWeight: 500, marginBottom: 10, color: '#000' }}>
              Explore. Evaluate. Formulate. Ten high-impact profiles in one streamlined kit.
            </div>
            <h1 className="ss-title">Explore our curated flavor sample sets.</h1>
            <p className="ss-subtitle">
              Each kit includes <strong>5 hand-picked profiles</strong> designed to help you quickly identify the right
              direction for R&amp;D, sensory evaluation, and product matching.
            </p>
            <div className="ss-miniRow">
              <div className="ss-pill">5 profiles per kit</div>
              <div className="ss-pill">Built for fast evaluation</div>
              <div className="ss-pill">Consistent &amp; repeatable</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ss-section">
        <div className="ss-inner">
          <div className="ss-grid" data-mobile={isMobile ? "1" : "0"}>
            {displayedCollections.map((c, i) => (
              <SampleCollectionCard key={`${c.id}-${i}`} collection={c} variantIndex={i} />
            ))}
          </div>

          {/* How it works section removed as requested */}
        </div>
      </section>
      {/* Footer with contact information */}
      <footer style={{
        marginTop: 48,
        padding: '32px 0 24px 0',
        background: '#f8fafc',
        color: '#222',
        textAlign: 'center',
        fontSize: 15,
        borderTop: '1px solid #e5e7eb',
      }}>
        <div style={{fontWeight: 900, fontSize: 18, marginBottom: 8}}>Contact Us</div>
        <div style={{marginBottom: 6}}>
          Email: <a href="mailto:info@elementlab.com" style={{color:'#7c3aed',textDecoration:'none'}}>info@elementlab.com</a>
        </div>
        <div style={{marginBottom: 6}}>
          Phone: <a href="tel:+1234567890" style={{color:'#7c3aed',textDecoration:'none'}}>+1 (234) 567-890</a>
        </div>
        <div style={{marginBottom: 6}}>
          Address: 1234 Terpene Ave, Suite 100, Los Angeles, CA 90001
        </div>
        <div style={{marginTop: 18, fontSize: 13, color: '#888'}}>
          &copy; {new Date().getFullYear()} Element Lab. All rights reserved.
        </div>
      </footer>
    </div>
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





function SampleCollectionCard({ collection, variantIndex = 0 }) {
  const navigate = useNavigate();
  const cardImageSrc = getCollectionImageUrl(collection);
  const [sampleProfiles, setSampleProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/collections/${encodeURIComponent(collection.collectionId)}/sample-profiles`);
        const data = await res.json();
        if (alive) setSampleProfiles(Array.isArray(data?.sampleProfiles) ? data.sampleProfiles : []);
      } catch {
        if (alive) setSampleProfiles([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (collection.collectionId) load();
    return () => { alive = false; };
  }, [collection.collectionId]);

  const handleCardClick = () => {
    if (collection.collectionId) {
      navigate(`/samples/${collection.collectionId}`);
    }
  };

  return (
    <button
      type="button"
      className={`ss-card ss-card--v${(variantIndex % 4) + 1}`}
      onClick={handleCardClick}
      aria-label={`Open ${collection.name} sample kit`}
    >
      <div className="ss-cardTop">
        <div className="ss-cardBadge">{collection.tagline || "Sample Kit"}</div>
        <div className="ss-cardName">
          {collection.name}
          {collection.collectionName && (
            <span style={{ fontSize: '0.85em', color: '#555', fontWeight: 400, marginLeft: 6 }}>
              ({collection.collectionName})
            </span>
          )}
        </div>
        <div className="ss-cardVibe">{collection.vibe || ""}</div>
      </div>

      <div className="ss-cardBody">
        <div className="ss-cardMedia" aria-hidden="true">
          {cardImageSrc ? (
            <img className="ss-cardImg" src={cardImageSrc} alt="" />
          ) : (
            <div className="ss-cardImgFallback" />
          )}
        </div>

        <div className="ss-cardRight">
          <div className="ss-cardSub">Included profiles</div>

          {loading ? (
            <div className="ss-muted">Loading samples…</div>
          ) : sampleProfiles.length ? (
            <div className="ss-chipWrap">
              {sampleProfiles.slice(0, 5).map((sp) => (
                <span key={sp.profile_id} className="ss-chip">
                  {sp.name || sp.slug}
                </span>
              ))}
            </div>
          ) : (
            <div className="ss-muted">No samples selected yet.</div>
          )}

          <div className="ss-cardFooter">
            <div className="ss-meta">Tap to view kit details</div>
            <div className="ss-action">View kit →</div>
          </div>
        </div>
      </div>
    </button>
  );
}
