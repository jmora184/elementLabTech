import React, { useEffect, useMemo, useState } from "react";
import { addCartItem } from "../../utils/cart";
import { Link, useParams } from "react-router-dom";
import "../TerpeneShowcase/TerpeneShowcase.css";
import "./SampleShowcaseProductPage.css";

function safeParseJson(value, fallback) {
  if (!value) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  try {
    const v = JSON.parse(value);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function getCollectionImageUrl(collection) {
  try {
    const arr = safeParseJson(collection?.images_json, []);
    if (Array.isArray(arr) && arr.length) {
      const primary = arr.find((r) => !!r?.isPrimary && typeof r?.url === "string" && r.url.trim());
      const first = arr.find((r) => typeof r?.url === "string" && r.url.trim());
      const url = (primary?.url || first?.url || "").trim();
      return url;
    }
  } catch {
    // ignore
  }
  return "";
}

function normalizeBundleMap(bundles) {
  return new Map(
    (bundles || []).map((b) => [String(b?.profile?.slug || b?.slug || "").trim(), b]).filter(([slug]) => !!slug)
  );
}

export default function SampleShowcaseProductPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [profileBundles, setProfileBundles] = useState([]);
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [expandedSlug, setExpandedSlug] = useState("");
  const [showAllFlavors, setShowAllFlavors] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function fetchAll() {
      setLoading(true);
      setError("");
      setCollection(null);
      setAllProfiles([]);
      setProfileBundles([]);
      setSelectedSlugs([]);
      setExpandedSlug("");

      try {
        const colRes = await fetch(`/api/collections/${encodeURIComponent(id)}`);
        const colData = await colRes.json();
        if (!alive) return;
        if (!colRes.ok) throw new Error(colData?.error || "Collection not found.");
        setCollection(colData?.collection || null);

        const [allRes, sampleRes] = await Promise.all([
          fetch(`/api/collections/${encodeURIComponent(id)}/profiles`),
          fetch(`/api/collections/${encodeURIComponent(id)}/sample-profiles`).catch(() => null),
        ]);

        const allData = await allRes.json().catch(() => null);
        const sampleData = sampleRes ? await sampleRes.json().catch(() => null) : null;
        if (!alive) return;

        const all = Array.isArray(allData?.profiles) ? allData.profiles : [];
        const curated = Array.isArray(sampleData?.sampleProfiles) ? sampleData.sampleProfiles : [];

        setAllProfiles(all);

        const defaultSelected = curated.length
          ? curated.map((x) => String(x?.slug || "").trim()).filter(Boolean).slice(0, 5)
          : all.map((x) => String(x?.slug || "").trim()).filter(Boolean).slice(0, 5);

        setSelectedSlugs(defaultSelected);
        setExpandedSlug(defaultSelected[0] || all[0]?.slug || "");

        const uniqueSlugs = Array.from(
          new Set(all.map((x) => String(x?.slug || "").trim()).filter(Boolean))
        );

        const bundles = await Promise.all(
          uniqueSlugs.map(async (slug) => {
            try {
              const r = await fetch(`/api/profiles/${encodeURIComponent(slug)}`);
              const d = await r.json().catch(() => null);
              if (!r.ok) return { ok: false, slug, error: d?.error || "Not found" };
              return { ok: true, slug, ...d };
            } catch (e) {
              return { ok: false, slug, error: e?.message || "Failed" };
            }
          })
        );

        if (!alive) return;
        setProfileBundles(bundles.filter((b) => b?.ok));
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load kit.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) fetchAll();
    return () => {
      alive = false;
    };
  }, [id]);

  const heroImage = useMemo(() => getCollectionImageUrl(collection), [collection]);
  const bundleMap = useMemo(() => normalizeBundleMap(profileBundles), [profileBundles]);

  const selectedProfiles = useMemo(() => {
    const bySlug = new Map(allProfiles.map((p) => [String(p?.slug || "").trim(), p]));
    return selectedSlugs
      .map((slug) => {
        const sp = bySlug.get(slug);
        if (!sp) return null;
        return { sp, bundle: bundleMap.get(slug) || null };
      })
      .filter(Boolean);
  }, [allProfiles, bundleMap, selectedSlugs]);

  const visibleProfiles = useMemo(() => {
    if (showAllFlavors) return allProfiles;
    return allProfiles.slice(0, 5);
  }, [allProfiles, showAllFlavors]);

  function toggleFlavor(slug) {
    const cleanSlug = String(slug || "").trim();
    if (!cleanSlug) return;

    setSelectedSlugs((prev) => {
      if (prev.includes(cleanSlug)) {
        return prev.filter((x) => x !== cleanSlug);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, cleanSlug];
    });
  }

  if (loading) {
    return (
      <div className="ssp-wrap">
        <div className="ssp-loading">Loading kit…</div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="ssp-wrap">
        <div className="ssp-errorTitle">Kit not found</div>
        <div className="ssp-errorMsg">{error || "This sample kit doesn’t exist (or isn’t active)."}</div>
        <Link className="ssp-back" to="/samples">← Back to sample kits</Link>
      </div>
    );
  }

  const canAddToCart = selectedProfiles.length === 5;

  return (
    <div className="ssp-page" style={{ paddingTop: 24 }}>
      <div className="ssp-wrap">
        <div className="ssp-crumbs" style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          <br />
          <Link to="/samples" style={{ color: "#7c3aed", textDecoration: "none" }}>Samples</Link>
          <span className="ssp-crumbSep" style={{ margin: "0 10px" }}>/</span>
          <span>{collection.name}</span>
        </div>

        <section className="ssp-hero">
          <div className="ssp-heroLeft">
            <div className="ssp-kicker"><span style={{ color: "#111" }}>Sample Kit</span></div>
            <h1 className="ssp-title">{collection.name}</h1>
            {collection.tagline ? <div className="ssp-tagline">{collection.tagline}</div> : null}
            {collection.description ? (
              <p className="ssp-desc">{collection.description}</p>
            ) : (
              <p className="ssp-desc">
                Build your sample kit by choosing any 5 profiles from this collection.
              </p>
            )}

            <div className="ssp-heroBadges">
              <div className="ssp-badge">Choose any 5 profiles</div>
              <div className="ssp-badge">{allProfiles.length} flavors available</div>
              <div className="ssp-badge">Designed for R&amp;D</div>
            </div>

            <div className="ssp-actions">
              <button
                className="ssp-primary"
                type="button"
                disabled={!canAddToCart}
                style={{ width: "100%", opacity: canAddToCart ? 1 : 0.6, cursor: canAddToCart ? "pointer" : "not-allowed" }}
                onClick={() => {
                  if (!canAddToCart) return;
                  addCartItem({
                    productId: collection?.id,
                    collectionName: collection?.name,
                    profileSlug: "sample-kit",
                    profileName: `${collection?.name} Sample Kit`,
                    size: "Sample Kit",
                    quantity: 1,
                    selectedProfiles: selectedProfiles.map(({ sp }) => ({
                      slug: sp?.slug,
                      name: sp?.name,
                    })),
                  });
                }}
              >
                {canAddToCart ? "Add To Cart $199" : `Select ${5 - selectedProfiles.length} more flavor${5 - selectedProfiles.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>

          <div className="ssp-heroRight" aria-hidden="true">
            {heroImage ? <img className="ssp-heroImg" src={heroImage} alt="" /> : <div className="ssp-heroImgFallback" />}
          </div>
        </section>

        <section className="ssp-body" id="profiles">
          <aside className="ssp-side" aria-label="Your kit" style={{ color: "#111" }}>
            <div className="ssp-sideCard">
              <div className="ssp-sideTitle">Your kit</div>
              <div className="ssp-sideSub">Pick 5 flavor profiles from the list.</div>
              <div className="ssp-sideCount">{selectedProfiles.length} / 5 selected</div>

              <div className="ssp-sideList">
                {selectedProfiles.length ? (
                  selectedProfiles.map(({ sp }, idx) => (
                    <button
                      key={sp?.profile_id || sp?.slug || idx}
                      type="button"
                      className="ssp-sideItem ssp-sideItemButton"
                      onClick={() => {
                        setExpandedSlug(String(sp?.slug || ""));
                        const el = document.getElementById(`selector-${encodeURIComponent(sp?.slug || String(idx))}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      <span className="ssp-sideNum">{idx + 1}</span>
                      <span className="ssp-sideName">{sp?.name || sp?.slug}</span>
                    </button>
                  ))
                ) : (
                  <div className="ssp-sideEmpty">No flavors selected yet.</div>
                )}
              </div>

              <div className="ssp-sideNote">
                Use the checkboxes on the right. Click any flavor row to show the full description directly underneath it.
              </div>
            </div>
          </aside>

          <div className="ssp-main">
            {/* Section header and toggle removed as requested */}

            <div className="ssp-profileGrid">
              {visibleProfiles.length ? (
                visibleProfiles.map((sp, idx) => (
                  <FlavorSelectorRow
                    key={sp.profile_id || sp.slug || idx}
                    index={idx}
                    sp={sp}
                    bundle={bundleMap.get(String(sp?.slug || "").trim()) || null}
                    isSelected={selectedSlugs.includes(String(sp?.slug || "").trim())}
                    expanded={expandedSlug === String(sp?.slug || "").trim()}
                    selectionLocked={!selectedSlugs.includes(String(sp?.slug || "").trim()) && selectedSlugs.length >= 5}
                    onToggleSelected={() => toggleFlavor(sp?.slug)}
                    onToggleExpanded={() => {
                      const slug = String(sp?.slug || "").trim();
                      setExpandedSlug((prev) => (prev === slug ? "" : slug));
                    }}
                  />
                ))
              ) : (
                <div className="ssp-empty">No profiles are configured for this sample kit yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function FlavorSelectorRow({
  index,
  sp,
  bundle,
  isSelected,
  expanded,
  selectionLocked,
  onToggleSelected,
  onToggleExpanded,
}) {
  const profile = bundle?.profile || null;
  const aroma = Array.isArray(profile?.flavor_aroma) ? profile.flavor_aroma : [];
  const domTerps = Array.isArray(profile?.dominant_terpenes) ? profile.dominant_terpenes : [];
  const mood = String(profile?.mood || "").trim();
  const description = String(profile?.description || "").trim();
  const images = Array.isArray(bundle?.images) ? bundle.images : [];
  const primaryImg = images.find((x) => typeof x?.url === "string" && x.url.trim())?.url || "";
  const rowId = `selector-${encodeURIComponent(sp?.slug || String(index))}`;

  return (
    <div className={`ssp-profileCard ${expanded ? "is-open" : ""} ${isSelected ? "is-selected" : ""}`} id={rowId}>
      <div className="ssp-selectorHeaderWrap">
        <label className="ssp-checkWrap" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="ssp-check"
            checked={isSelected}
            disabled={selectionLocked}
            onChange={onToggleSelected}
          />
        </label>

        <button
          type="button"
          className="ssp-profileHeader"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          <div className="ssp-profileLeft">
            <div className="ssp-profileIndex">{index + 1}</div>
            <div>
              <div className="ssp-profileName">{sp.name || sp.slug}</div>
              {profile?.flavor_type || profile?.flavor_category ? (
                <div className="ssp-profileMeta">
                  {profile?.flavor_type && profile?.flavor_type !== (sp.name || sp.slug) ? <span>{profile.flavor_type}</span> : null}
                  {profile?.flavor_category ? <span>{profile?.flavor_type && profile?.flavor_type !== (sp.name || sp.slug) ? " • " : ""}{profile.flavor_category}</span> : null}
                </div>
              ) : (
                <div className="ssp-profileMeta">Click to view full description</div>
              )}
            </div>
          </div>
          <div className="ssp-profileChevron">{expanded ? "–" : "+"}</div>
        </button>
      </div>

      {expanded ? (
        <div className="ssp-profileBody">
          <div className="ssp-profileBodyInner">
            <div className="ssp-profileCopy">
              {description ? <p className="ssp-profileDesc">{description}</p> : <p className="ssp-profileDesc">No description added yet.</p>}

              {mood ? (
                <div className="ssp-row">
                  <div className="ssp-rowLabel">Mood</div>
                  <div className="ssp-rowValue">{mood}</div>
                </div>
              ) : null}

              {aroma.length ? (
                <div className="ssp-row">
                  <div className="ssp-rowLabel">Aroma</div>
                  <div className="ssp-chipRow">
                    {aroma.slice(0, 12).map((t, i) => (
                      <span key={`${t}-${i}`} className="ssp-chip">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {domTerps.length ? (
                <div className="ssp-row">
                  <div className="ssp-rowLabel">Dominant terpenes</div>
                  <div className="ssp-chipRow">
                    {domTerps.slice(0, 12).map((t, i) => (
                      <span key={`${t}-${i}`} className="ssp-chip ssp-chipAlt">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="ssp-profileMedia" aria-hidden="true">
              {primaryImg ? <img className="ssp-profileImg" src={primaryImg} alt="" /> : <div className="ssp-profileImgFallback" />}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
