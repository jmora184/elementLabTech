import React, { useEffect, useState } from "react";
import { heroCopy, terpeneCollections } from "./terpenesData";
import "./TerpeneShowcase.css";
import bottleImg from "../../assets/bottle.png";
import { useIsMobile } from "./useIsMobile";
import { useNavigate } from "react-router-dom";
import TerpeneSimulator from "../TerpeneSimulator/TerpeneSimulator";
import { uploadImageFile } from "../../utils/cloudflareImages";
// Header is provided globally by SiteLayout.

export default function TerpeneShowcase({ HeroBanner }) {
  const isMobile = useIsMobile();

  const addToCart = () => {};

  // Load collections from DB (fallback to hardcoded if API/DB not ready)
  const [dbCollections, setDbCollections] = useState(null); // null = loading/unknown
  const displayedCollections = Array.isArray(dbCollections) && dbCollections.length
    ? dbCollections
    : terpeneCollections;

  // Current user (to show admin-only controls)
  const [me, setMe] = useState(null);
  const isAdmin = (me?.role || "user") === "admin";

  // Add Collection modal state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    id: "",
    badge: "",
    tagline: "",
    description: "",
    sort_order: 0,
    is_active: 1,
  });
  const [addError, setAddError] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addImages, setAddImages] = useState([]); // [{ url, alt, isPrimary }]
  const [addImgBusy, setAddImgBusy] = useState(false);

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

  async function loadCollections() {
    try {
      const d = await fetchJson("/api/collections");
      setDbCollections(Array.isArray(d?.collections) ? d.collections : []);
    } catch (err) {
      // Fall back to hardcoded without breaking homepage
      console.warn("DB collections load failed, falling back to hardcoded:", err?.message || err);
      setDbCollections([]);
    }
  }

  useEffect(() => {
    // Load current user
    fetchJson("/api/auth/me")
      .then((d) => setMe(d?.user || null))
      .catch(() => setMe(null));

    // Load collections list
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitAddCollection() {
    setAddError("");
    setAddBusy(true);
    try {
      const payload = {
        name: addForm.name,
        id: addForm.id,
        badge: addForm.badge,
        tagline: addForm.tagline,
        description: addForm.description,
        sort_order: Number(addForm.sort_order) || 0,
        is_active: addForm.is_active ? 1 : 0,
        images: Array.isArray(addImages)
          ? addImages
              .filter((x) => x && typeof x.url === "string" && x.url.trim())
              .map((x, idx) => ({
                url: String(x.url).trim(),
                alt: String(x.alt || "").trim(),
                isPrimary: !!x.isPrimary,
              }))
          : [],
      };
      await fetchJson("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setShowAdd(false);
      setAddForm({ name: "", id: "", badge: "", tagline: "", description: "", sort_order: 0, is_active: 1 });
      setAddImages([]);
      await loadCollections();
    } catch (err) {
      setAddError(err?.message || "Request failed");
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <>
      {/* Desktop content */}
      {!isMobile && (
        <>
          {HeroBanner && <HeroBanner />}
          <section className="ts-section">
            <div className="ts-inner">
              {isAdmin && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.35)",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    + Add Collection
                  </button>
                </div>
              )}
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
            {isAdmin && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  + Add Collection
                </button>
              </div>
            )}
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

      {showAdd && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onMouseDown={(e) => {
            // click outside to close
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div
            style={{
              width: "min(720px, 96vw)",
              borderRadius: 18,
              background: "rgba(10, 15, 25, 0.96)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
              padding: 18,
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Add Collection</div>
                <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                  Creates a new homepage collection card (admin only).
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <label style={{ fontSize: 12, opacity: 0.85 }}>Name *</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
                  style={inputStyle}
                  placeholder="Amplify Collection"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.85 }}>Id / Slug (optional)</label>
                <input
                  value={addForm.id}
                  onChange={(e) => setAddForm((s) => ({ ...s, id: e.target.value }))}
                  style={inputStyle}
                  placeholder="amplify-collection"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.85 }}>Badge</label>
                <input
                  value={addForm.badge}
                  onChange={(e) => setAddForm((s) => ({ ...s, badge: e.target.value }))}
                  style={inputStyle}
                  placeholder="AMPLIFY"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.85 }}>Tagline</label>
                <input
                  value={addForm.tagline}
                  onChange={(e) => setAddForm((s) => ({ ...s, tagline: e.target.value }))}
                  style={inputStyle}
                  placeholder="Terpene-inspired profiles"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, opacity: 0.85 }}>Description</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm((s) => ({ ...s, description: e.target.value }))}
                  style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                  placeholder="A curated set of terpene-inspired profiles..."
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, opacity: 0.85 }}>Upload collection images (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={addImgBusy || addBusy}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = "";
                    if (!files.length) return;
                    setAddError("");
                    setAddImgBusy(true);
                    try {
                      for (const file of files) {
                        const out = await uploadImageFile(file, { metadata: { purpose: "collection", slug: addForm.id || addForm.name } });
                        if (!out?.url) throw new Error("Upload succeeded but no delivery URL was returned.");
                        setAddImages((p) => {
                          const next = Array.isArray(p) ? [...p] : [];
                          next.push({ url: out.url, alt: "", isPrimary: next.length === 0 });
                          return next;
                        });
                      }
                    } catch (ex) {
                      setAddError(ex?.message || "Image upload failed.");
                    } finally {
                      setAddImgBusy(false);
                    }
                  }}
                  style={{ ...inputStyle, paddingTop: 10, paddingBottom: 10 }}
                />
                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
                  Pick files from your device (or drag-select multiple). They’ll upload to Cloudflare Images.
                </div>

                {!!addImages.length && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                    {addImages.map((img, idx) => (
                      <div key={idx} style={{ display: "grid", gap: 6, width: 160 }}>
                        <img
                          src={img.url}
                          alt={img.alt || ""}
                          style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
                        />
                        <input
                          value={img.alt || ""}
                          onChange={(e) => setAddImages((p) => p.map((r, i) => (i === idx ? { ...r, alt: e.target.value } : r)))}
                          placeholder="Alt text"
                          style={inputStyle}
                        />
<label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: 0.9 }}>
                          <input
                            type="radio"
                            name="collectionPrimaryImage"
                            checked={!!img.isPrimary}
                            onChange={() =>
                              setAddImages((p) => p.map((r, i) => ({ ...r, isPrimary: i === idx })))
                            }
                          />
                          <span>Primary</span>
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setAddImages((p) => {
                              const next = p.filter((_, i) => i !== idx);
                              if (!next.length) return next;
                              const hasPrimary = next.some((x) => !!x.isPrimary);
                              if (hasPrimary) return next;
                              // If we removed the primary image, promote the first remaining image
                              return next.map((x, i) => ({ ...x, isPrimary: i === 0 }));
                            })
                          }
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: 800,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.85 }}>Sort order</label>
                <input
                  type="number"
                  value={addForm.sort_order}
                  onChange={(e) => setAddForm((s) => ({ ...s, sort_order: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="add-active"
                  type="checkbox"
                  checked={!!addForm.is_active}
                  onChange={(e) => setAddForm((s) => ({ ...s, is_active: e.target.checked ? 1 : 0 }))}
                />
                <label htmlFor="add-active" style={{ fontSize: 13, opacity: 0.9 }}>
                  Show on site
                </label>
              </div>
            </div>

            {addError && (
              <div style={{ marginTop: 10, color: "#ff7b7b", fontSize: 13, fontWeight: 700 }}>
                {addError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
                disabled={addBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAddCollection}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#ff3b30",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
                disabled={addBusy || !String(addForm.name || "").trim()}
              >
                {addBusy ? "Creating..." : "Create Collection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  outline: "none",
  fontSize: 14,
};

function CollectionCard({ collection, isMobile, cardClass, addToCart, cardIndex }) {
  const navigate = useNavigate();
  let cardImageSrc = bottleImg;
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
            src={cardImageSrc}
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

