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

export default function SampleShowcaseProductPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [sampleProfiles, setSampleProfiles] = useState([]);
  const [profileBundles, setProfileBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function fetchAll() {
      setLoading(true);
      setError("");
      setCollection(null);
      setSampleProfiles([]);
      setProfileBundles([]);

      try {
        const colRes = await fetch(`/api/collections/${encodeURIComponent(id)}`);
        const colData = await colRes.json();
        if (!alive) return;
        if (!colRes.ok) throw new Error(colData?.error || "Collection not found.");
        setCollection(colData?.collection || null);

        // Pull the curated set of up to 5 sample profiles.
        const spRes = await fetch(`/api/collections/${encodeURIComponent(id)}/sample-profiles`);
        const spData = await spRes.json().catch(() => null);
        if (!alive) return;
        const sp = Array.isArray(spData?.sampleProfiles) ? spData.sampleProfiles : [];
        setSampleProfiles(sp);

        // Fetch profile bundles (description, mood, aroma tags, etc.)
        const slugs = sp.map((x) => String(x?.slug || "").trim()).filter(Boolean);
        const uniqueSlugs = Array.from(new Set(slugs)).slice(0, 5);

        const bundles = await Promise.all(
          uniqueSlugs.map(async (slug) => {
            try {
              const r = await fetch(`/api/profiles/${encodeURIComponent(slug)}`);
              const d = await r.json();
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

  const orderedProfiles = useMemo(() => {
    const bySlug = new Map(profileBundles.map((b) => [String(b?.profile?.slug || b?.slug || ""), b]));
    return (sampleProfiles || [])
      .slice(0, 5)
      .map((sp) => {
        const slug = String(sp?.slug || "");
        const bundle = bySlug.get(slug);
        return { sp, bundle };
      })
      .filter((x) => !!x?.sp);
  }, [profileBundles, sampleProfiles]);

  const heroImage = useMemo(() => getCollectionImageUrl(collection), [collection]);

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

  return (
    <div className="ssp-page" style={{ paddingTop: 24 }}>
      <div className="ssp-wrap">
        <div className="ssp-crumbs" style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          <br />
          <Link to="/samples" style={{ color: '#7c3aed', textDecoration: 'none' }}>Samples</Link>
          <span className="ssp-crumbSep" style={{ margin: '0 10px' }}>/</span>
          <span>{collection.name}</span>
          <span style={{ color: '#111' }}>{collection.name}</span>
        </div>

        <section className="ssp-hero">
          <div className="ssp-heroLeft">
            <div className="ssp-kicker"><span style={{ color: '#111' }}>Sample Kit</span></div>
            <h1 className="ssp-title">{collection.name}</h1>
            {collection.tagline ? <div className="ssp-tagline">{collection.tagline}</div> : null}
            {collection.description ? (
              <p className="ssp-desc">{collection.description}</p>
            ) : (
              <p className="ssp-desc">
                A curated set of 5 profiles designed for fast evaluation and confident product-direction decisions.
              </p>
            )}

            <div className="ssp-heroBadges">
              <div className="ssp-badge">5 profiles included</div>
              <div className="ssp-badge">Designed for R&amp;D</div>
              <div className="ssp-badge">Consistent &amp; repeatable</div>
            </div>

            <div className="ssp-actions">
              <button
                className="ssp-primary"
                type="button"
                style={{ width: '100%' }}
                onClick={() => {
                  addCartItem({
                    productId: collection?.id,
                    collectionName: collection?.name,
                    profileSlug: "sample-kit",
                    profileName: collection?.name,
                    size: "Sample Kit",
                    quantity: 1,
                  });
                  // Optionally, navigate to cart or show a confirmation
                }}
              >
                Add To Cart $199
              </button>
            </div>
          </div>

          <div className="ssp-heroRight" aria-hidden="true">
            {heroImage ? <img className="ssp-heroImg" src={heroImage} alt="" /> : <div className="ssp-heroImgFallback" />}
          </div>
        </section>

        {/* Contact section moved to bottom */}
        <section className="ssp-body" id="profiles">
          <aside className="ssp-side" aria-label="In this kit" style={{ color: '#111' }}>
            <div className="ssp-sideCard">
              <div className="ssp-sideTitle">In this kit</div>
              <div className="ssp-sideList">
                {(sampleProfiles || []).slice(0, 5).map((sp, idx) => (
                  <a
                    key={sp.profile_id || sp.slug || idx}
                    href={`#profile-${encodeURIComponent(sp.slug || String(idx))}`}
                    className="ssp-sideItem"
                  >
                    <span className="ssp-sideNum">{idx + 1}</span>
                    <span className="ssp-sideName">{sp.name || sp.slug}</span>
                  </a>
                ))}
              </div>
              <div className="ssp-sideNote">
                Each profile card below includes the description, aroma tags, and dominant terpenes (when available).
              </div>
            </div>
          </aside>

          <div className="ssp-main">

            <div className="ssp-profileGrid">
              {orderedProfiles.length ? (
                orderedProfiles.map(({ sp, bundle }, idx) => (
                  <ProfileAccordionCard
                    key={sp.profile_id || sp.slug || idx}
                    index={idx}
                    sp={sp}
                    bundle={bundle}
                  />
                ))
              ) : (
                <div className="ssp-empty">
                  No profiles are configured for this sample kit yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
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

function ProfileAccordionCard({ index, sp, bundle }) {
  const [open, setOpen] = useState(index === 0);
  const profile = bundle?.profile || null;

  const aroma = Array.isArray(profile?.flavor_aroma) ? profile.flavor_aroma : [];
  const domTerps = Array.isArray(profile?.dominant_terpenes) ? profile.dominant_terpenes : [];
  const mood = String(profile?.mood || "").trim();
  const description = String(profile?.description || "").trim();

  const images = Array.isArray(bundle?.images) ? bundle.images : [];
  const primaryImg = images.find((x) => typeof x?.url === "string" && x.url.trim())?.url || "";

  const anchorId = `profile-${encodeURIComponent(sp.slug || String(index))}`;

  return (
    <div className={`ssp-profileCard ${open ? "is-open" : ""}`} id={anchorId}>
      <button
        type="button"
        className="ssp-profileHeader"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="ssp-profileLeft">
          <div className="ssp-profileIndex">{index + 1}</div>
          <div>
            <div className="ssp-profileName">{sp.name || sp.slug}</div>
            {profile?.flavor_type || profile?.flavor_category ? (
              <div className="ssp-profileMeta">
                {/* Only show flavor_type if it is not identical to the profile name */}
                {profile?.flavor_type && profile?.flavor_type !== (sp.name || sp.slug) ? <span>{profile.flavor_type}</span> : null}
                {profile?.flavor_category ? <span>• {profile.flavor_category}</span> : null}
              </div>
            ) : (
              <div className="ssp-profileMeta">Click to view details</div>
            )}
          </div>
        </div>
        <div className="ssp-profileChevron">{open ? "–" : "+"}</div>
      </button>

      {open ? (
        <div className="ssp-profileBody">
          <div className="ssp-profileBodyInner">
            <div className="ssp-profileCopy">
              {description ? <p className="ssp-profileDesc">{description}</p> : null}

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
              {primaryImg ? (
                <img className="ssp-profileImg" src={primaryImg} alt="" />
              ) : (
                <div className="ssp-profileImgFallback" />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
