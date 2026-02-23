import React, { useEffect, useMemo, useState } from "react";
import "../ProductPage/ProductPage.css";
import { useAuth } from "../../auth/AuthContext";
import AdminEditProfileModal from "../ProductPage/AdminEditProfileModal";
import { addCartItem } from "../../utils/cart";

function parseJsonArray(value, fallback = []) {
  if (!value) return fallback;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

function pickIsolateCollection(collections = []) {
  const rows = Array.isArray(collections) ? collections : [];
  if (!rows.length) return null;

  const preferredIds = ["isolate-collection", "isolates-collection", "isolates"];
  const byPreferredId = rows.find((row) => {
    const id = String(row?.id || "").toLowerCase();
    return preferredIds.includes(id);
  });
  if (byPreferredId) return byPreferredId;

  const byId = rows.find((row) => /isolate/i.test(String(row?.id || "")));
  if (byId) return byId;

  const byName = rows.find((row) => /isolate/i.test(String(row?.name || "")));
  if (byName) return byName;

  return null;
}

const TABS = ["Details", "Specs", "Applications"];

export default function IsolatesShowcase() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collection, setCollection] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [profileBundle, setProfileBundle] = useState(null);
  const [tab, setTab] = useState("Details");
  const [selectedSize, setSelectedSize] = useState("2mL | 1.84 g - $20");
  const [quantity, setQuantity] = useState(1);

  const [showEditCollection, setShowEditCollection] = useState(false);
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [collectionErr, setCollectionErr] = useState("");
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    badge: "",
    tagline: "",
    description: "",
    specs_json: "[]",
    isolates_json: "[]",
  });

  const [showAddProfile, setShowAddProfile] = useState(false);
  const [addProfileSaving, setAddProfileSaving] = useState(false);
  const [addProfileErr, setAddProfileErr] = useState("");
  const [addForm, setAddForm] = useState({
    name: "",
    slug: "",
    flavor_type: "",
    flavor_category: "",
    description: "",
    mood: "",
    dominant_terpenes_csv: "",
    flavor_aroma_csv: "",
    sort_order: "",
  });

  const [showEditProfile, setShowEditProfile] = useState(false);

  async function loadCollectionAndProfiles(targetCollectionId, { preserveSelection = true } = {}) {
    const collectionRes = await fetchJson(`/api/collections/${encodeURIComponent(targetCollectionId)}`);
    const collectionRow = collectionRes?.collection || null;
    setCollection(collectionRow);

    const profilesRes = await fetchJson(`/api/collections/${encodeURIComponent(targetCollectionId)}/profiles`);
    const rows = Array.isArray(profilesRes?.profiles) ? profilesRes.profiles : [];
    setProfiles(rows);

    const nextSlug =
      preserveSelection && selectedSlug && rows.some((x) => x.slug === selectedSlug)
        ? selectedSlug
        : rows[0]?.slug || "";
    setSelectedSlug(nextSlug);
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const list = await fetchJson("/api/collections");
        if (!alive) return;

        const selectedCollection = pickIsolateCollection(list?.collections || []);
        if (!selectedCollection?.id) {
          throw new Error("No isolate collection found. Create a dedicated collection with id 'isolate-collection' (or a name/id containing 'isolate').");
        }

        const collectionRes = await fetchJson(`/api/collections/${encodeURIComponent(selectedCollection.id)}`);
        if (!alive) return;
        setCollection(collectionRes?.collection || null);

        const profilesRes = await fetchJson(`/api/collections/${encodeURIComponent(selectedCollection.id)}/profiles`);
        if (!alive) return;
        const rows = Array.isArray(profilesRes?.profiles) ? profilesRes.profiles : [];
        setProfiles(rows);
        setSelectedSlug(rows[0]?.slug || "");
        if (!alive) return;
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Failed to load isolate collection.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadBundle() {
      if (!selectedSlug) {
        setProfileBundle(null);
        return;
      }
      try {
        const bundle = await fetchJson(`/api/profiles/${encodeURIComponent(selectedSlug)}`);
        if (!alive) return;
        setProfileBundle(bundle);
      } catch {
        if (!alive) return;
        setProfileBundle(null);
      }
    }

    loadBundle();
    return () => {
      alive = false;
    };
  }, [selectedSlug]);

  useEffect(() => {
    if (!collection) return;
    setCollectionForm({
      name: String(collection?.name || ""),
      badge: String(collection?.badge || ""),
      tagline: String(collection?.tagline || ""),
      description: String(collection?.description || ""),
      specs_json: JSON.stringify(parseJsonArray(collection?.specs_json, []), null, 2),
      isolates_json: JSON.stringify(parseJsonArray(collection?.isolates_json, []), null, 2),
    });
  }, [collection]);

  const collectionImages = useMemo(() => {
    const rows = parseJsonArray(collection?.images_json, []);
    return rows.map((row) => String(row?.url || "")).filter(Boolean);
  }, [collection?.images_json]);

  const profileImageRows = useMemo(() => {
    return Array.isArray(profileBundle?.images) ? profileBundle.images : [];
  }, [profileBundle?.images]);

  const selectedProfile = useMemo(() => {
    const fromList = profiles.find((item) => item.slug === selectedSlug) || profiles[0] || null;
    const profile = profileBundle?.profile || null;
    if (!fromList && !profile) return null;

    return {
      slug: profile?.slug || fromList?.slug || "",
      name: profile?.name || fromList?.name || "Unnamed Profile",
      flavorCategory: profile?.flavor_category || "",
      description: profile?.description || collection?.description || "",
      dominantTerpenes: Array.isArray(profile?.dominant_terpenes) ? profile.dominant_terpenes : [],
      flavorAroma: Array.isArray(profile?.flavor_aroma) ? profile.flavor_aroma : [],
      mood: profile?.mood || "",
      image:
        String(profileImageRows[0]?.url || "") ||
        String(collectionImages[0] || ""),
      specs: parseJsonArray(collection?.specs_json, []),
      applications: parseJsonArray(collection?.isolates_json, []),
    };
  }, [profiles, selectedSlug, profileBundle, collection?.description, collection?.specs_json, collection?.isolates_json, collectionImages, profileImageRows]);

  const fallbackSpecs = selectedProfile?.specs?.length
    ? selectedProfile.specs
    : [
        { label: "Purity", value: "Configured per profile" },
        { label: "Form", value: "Liquid" },
      ];

  const fallbackApplications = selectedProfile?.applications?.length
    ? selectedProfile.applications
    : ["Beverages", "Edibles", "Vape"]; 

  async function saveCollectionEdits() {
    if (!collection?.id) return;
    setCollectionErr("");
    setCollectionSaving(true);
    try {
      let parsedSpecs = [];
      let parsedApplications = [];
      try {
        parsedSpecs = JSON.parse(collectionForm.specs_json || "[]");
      } catch {
        throw new Error("Specs must be valid JSON array.");
      }
      try {
        parsedApplications = JSON.parse(collectionForm.isolates_json || "[]");
      } catch {
        throw new Error("Applications must be valid JSON array.");
      }

      await fetchJson(`/api/collections/${encodeURIComponent(collection.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: collectionForm.name.trim(),
          badge: collectionForm.badge.trim(),
          tagline: collectionForm.tagline.trim(),
          description: collectionForm.description.trim(),
          specs: parsedSpecs,
          isolates: parsedApplications,
        }),
      });

      await loadCollectionAndProfiles(collection.id, { preserveSelection: true });
      setShowEditCollection(false);
    } catch (err) {
      setCollectionErr(err?.message || "Could not save collection.");
    } finally {
      setCollectionSaving(false);
    }
  }

  async function createProfile() {
    if (!collection?.id) return;
    setAddProfileErr("");
    const name = String(addForm.name || "").trim();
    if (!name) {
      setAddProfileErr("Name is required.");
      return;
    }

    setAddProfileSaving(true);
    try {
      const payload = {
        name,
        slug: String(addForm.slug || "").trim() || undefined,
        flavor_type: String(addForm.flavor_type || "").trim() || undefined,
        flavor_category: String(addForm.flavor_category || "").trim() || undefined,
        description: String(addForm.description || "").trim() || undefined,
        mood: String(addForm.mood || "").trim() || undefined,
        dominant_terpenes: String(addForm.dominant_terpenes_csv || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        flavor_aroma: String(addForm.flavor_aroma_csv || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        sort_order: addForm.sort_order === "" ? undefined : Number(addForm.sort_order),
      };

      const res = await fetchJson(`/api/collections/${encodeURIComponent(collection.id)}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await loadCollectionAndProfiles(collection.id, { preserveSelection: false });
      const createdSlug = String(res?.profile?.slug || "").trim();
      if (createdSlug) setSelectedSlug(createdSlug);

      setShowAddProfile(false);
      setAddForm({
        name: "",
        slug: "",
        flavor_type: "",
        flavor_category: "",
        description: "",
        mood: "",
        dominant_terpenes_csv: "",
        flavor_aroma_csv: "",
        sort_order: "",
      });
    } catch (err) {
      setAddProfileErr(err?.message || "Could not create profile.");
    } finally {
      setAddProfileSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="pp-page">
        <main className="pp-container">
          <div className="pp-muted">Loading isolates…</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-page">
        <main className="pp-container">
          <div className="pp-muted">{error}</div>
        </main>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="pp-page">
        <main className="pp-container">
          <div className="pp-muted">No isolate profiles found for this collection.</div>
        </main>
      </div>
    );
  }

  const activeImageIndex = Math.max(0, profiles.findIndex((p) => p.slug === selectedProfile.slug));

  return (
    <>
      <div className="pp-page">
        <main className="pp-container">
          <div className="pp-topGrid">
            <section className="pp-card pp-galleryCard" aria-label="Isolate gallery">
              <div className="pp-galleryMain">
                <img className="pp-mainImg" src={selectedProfile.image} alt={selectedProfile.name} />
              </div>

              <div className="pp-thumbRow">
                {profiles.map((profile, idx) => (
                  <button
                    key={profile.slug}
                    type="button"
                    className={`pp-thumb ${idx === activeImageIndex ? "isActive" : ""}`}
                    onClick={() => {
                      setSelectedSlug(profile.slug);
                      setTab("Details");
                    }}
                    aria-label={`View ${profile.name}`}
                  >
                    <img src={selectedSlug === profile.slug ? selectedProfile.image : collectionImages[0] || selectedProfile.image} alt={profile.name} />
                  </button>
                ))}
              </div>

              <div className="pp-galleryMeta">
                <span className="pp-badge">{collection?.badge || "Isolates"}</span>
                <div className="pp-collectionName">{collection?.name || "Isolate Collection"}</div>
                <p className="pp-muted" style={{ marginTop: 8 }}>{collection?.tagline || "Single-note compounds tuned for precision flavor design."}</p>
              </div>
            </section>

            <section className="pp-card pp-infoCard" aria-label="Isolate details">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <h2 className="pp-h2" style={{ margin: 0 }}>{selectedProfile.name}</h2>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="pp-docBtn"
                      onClick={() => {
                        setCollectionErr("");
                        setShowEditCollection(true);
                      }}
                    >
                      Edit Collection
                    </button>
                    <button
                      type="button"
                      className="pp-docBtn"
                      onClick={() => {
                        setAddProfileErr("");
                        setShowAddProfile(true);
                      }}
                    >
                      + Add Profile
                    </button>
                    <button
                      type="button"
                      className="pp-docBtn"
                      disabled={!selectedSlug}
                      onClick={() => setShowEditProfile(true)}
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>

              <div className="pp-tabBar">
                {TABS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`pp-tabBtn ${tab === item ? "isActive" : ""}`}
                    onClick={() => setTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="pp-tabPanel">
                {tab === "Details" && (
                  <div className="pp-flavorInfo">
                    <div className="pp-flavorTableWrap" aria-label="Isolate flavor table">
                      <div className="pp-tableScroll">
                        <table className="pp-flavorTable">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Natural flavor</th>
                              <th>Dominant terpenes</th>
                              <th>Flavor and aroma</th>
                              <th>Mood</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="pp-tdDesc" data-label="Description">{selectedProfile.description}</td>
                              <td className="pp-tdStrong" data-label="Natural flavor">{selectedProfile.flavorCategory}</td>
                              <td data-label="Dominant terpenes">
                                <div className="pp-cellList">
                                  {selectedProfile.dominantTerpenes.map((item) => (
                                    <span key={item} className="pp-cellPill">{item}</span>
                                  ))}
                                </div>
                              </td>
                              <td data-label="Flavor and aroma">
                                <div className="pp-cellList">
                                  {selectedProfile.flavorAroma.map((item) => (
                                    <span key={item} className="pp-cellPill">{item}</span>
                                  ))}
                                </div>
                              </td>
                              <td data-label="Mood">
                                <span style={{ color: "#eab308", fontWeight: 700 }}>{selectedProfile.mood}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "Specs" && (
                  <table className="pp-specTable">
                    <tbody>
                      {fallbackSpecs.map((row, idx) => (
                        <tr key={row.label}>
                          <th>{String(row?.label || row?.name || `Spec ${idx + 1}`)}</th>
                          <td>{String(row?.value || row?.percent || row?.amount || "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === "Applications" && (
                  <div className="pp-list">
                    {fallbackApplications.map((item, idx) => (
                      <div key={`${idx}-${String(item?.name || item)}`} className="pp-listRow">
                        <div style={{ fontWeight: 700 }}>{String(item?.name || item?.label || item)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <h3 className="pp-h3" style={{ marginBottom: 10 }}>Flavor Profiles</h3>
              <div className="pp-chipGrid">
                {profiles.map((profile) => (
                  <button
                    key={profile.slug}
                    type="button"
                    className={`pp-chip ${profile.slug === selectedSlug ? "isActive" : ""}`}
                    onClick={() => {
                      setSelectedSlug(profile.slug);
                      setTab("Details");
                    }}
                  >
                    {profile.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="pp-card pp-buyCard" aria-label="Isolate actions">
              <div className="pp-buySticky">
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 0, color: "var(--accent)" }}>
                  {selectedProfile.name}
                </div>
                <div className="pp-buyTitle" style={{ marginBottom: 0, color: "#fff" }}>
                  Flavor Choice
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--muted)" }}>
                    Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="2mL | 1.84 g - $20">2mL | 1.84 g - $20</option>
                    <option value="5mL | 4.2g - $35">5mL | 4.2g - $35</option>
                    <option value="24mL | 20g - $125">24mL | 20g - $125</option>
                    <option value="60mL | 50g | 2oz - $276">60mL | 50g | 2oz - $276</option>
                    <option value="111mL | 100g | 4oz - $418">111mL | 100g | 4oz - $418</option>
                    <option value="556mL | 500g | 19.9oz - $1897">556mL | 500g | 19.9oz - $1897</option>
                    <option value="1kg | 39.8oz - $2,999">1kg | 39.8oz - $2,999</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--muted)" }}>
                    Quantity
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        fontSize: 20,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      −
                    </button>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: "12px 8px",
                        paddingLeft: "16px",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        fontSize: 16,
                        fontWeight: 700,
                        textAlign: "center",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.min(10, prev + 1))}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        fontSize: 20,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="pp-primaryBtn"
                  style={{
                    width: "100%",
                    background: "var(--accent)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    fontSize: 16,
                  }}
                  onClick={() => {
                    addCartItem({
                      productId: String(collection?.id || "isolate-collection"),
                      collectionName: String(collection?.name || "isolate"),
                      profileSlug: String(selectedProfile?.slug || ""),
                      profileName: String(selectedProfile?.name || ""),
                      size: String(selectedSize || ""),
                      quantity,
                    });
                    alert(`Added ${quantity} × ${selectedSize} to cart!`);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 5.6M17 13l1.4 5.6M9 21a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add to cart
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>

      {isAdmin && showEditCollection && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit isolate collection"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditCollection(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "min(820px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 className="pp-h3" style={{ margin: 0 }}>Edit Isolate Collection</h3>
              <button type="button" className="pp-docBtn" onClick={() => setShowEditCollection(false)}>Close</button>
            </div>

            {collectionErr && (
              <div style={{ marginTop: 10, color: "#fecaca", fontWeight: 700 }}>{collectionErr}</div>
            )}

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <label className="pp-label">
                Name
                <input className="pp-input" value={collectionForm.name} onChange={(e) => setCollectionForm((p) => ({ ...p, name: e.target.value }))} />
              </label>

              <label className="pp-label">
                Badge
                <input className="pp-input" value={collectionForm.badge} onChange={(e) => setCollectionForm((p) => ({ ...p, badge: e.target.value }))} />
              </label>

              <label className="pp-label">
                Tagline
                <input className="pp-input" value={collectionForm.tagline} onChange={(e) => setCollectionForm((p) => ({ ...p, tagline: e.target.value }))} />
              </label>

              <label className="pp-label">
                Description
                <textarea className="pp-textarea" rows={3} value={collectionForm.description} onChange={(e) => setCollectionForm((p) => ({ ...p, description: e.target.value }))} />
              </label>

              <label className="pp-label">
                Specs JSON (array)
                <textarea className="pp-textarea" rows={6} value={collectionForm.specs_json} onChange={(e) => setCollectionForm((p) => ({ ...p, specs_json: e.target.value }))} />
              </label>

              <label className="pp-label">
                Applications JSON (array)
                <textarea className="pp-textarea" rows={6} value={collectionForm.isolates_json} onChange={(e) => setCollectionForm((p) => ({ ...p, isolates_json: e.target.value }))} />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button type="button" className="pp-docBtn" onClick={() => setShowEditCollection(false)}>Cancel</button>
              <button type="button" className="pp-primaryBtn" onClick={saveCollectionEdits} disabled={collectionSaving}>
                {collectionSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showAddProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add isolate profile"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddProfile(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 className="pp-h3" style={{ margin: 0 }}>Add Isolate Profile</h3>
              <button type="button" className="pp-docBtn" onClick={() => setShowAddProfile(false)}>Close</button>
            </div>

            {addProfileErr && <div style={{ marginTop: 10, color: "#fecaca", fontWeight: 700 }}>{addProfileErr}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <label className="pp-label">
                Name *
                <input className="pp-input" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} />
              </label>

              <label className="pp-label">
                Slug (optional)
                <input className="pp-input" value={addForm.slug} onChange={(e) => setAddForm((p) => ({ ...p, slug: e.target.value }))} />
              </label>

              <label className="pp-label">
                Flavor type
                <input className="pp-input" value={addForm.flavor_type} onChange={(e) => setAddForm((p) => ({ ...p, flavor_type: e.target.value }))} />
              </label>

              <label className="pp-label">
                Flavor category
                <input className="pp-input" value={addForm.flavor_category} onChange={(e) => setAddForm((p) => ({ ...p, flavor_category: e.target.value }))} />
              </label>

              <label className="pp-label" style={{ gridColumn: "1 / -1" }}>
                Description
                <textarea className="pp-textarea" rows={3} value={addForm.description} onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))} />
              </label>

              <label className="pp-label">
                Mood
                <input className="pp-input" value={addForm.mood} onChange={(e) => setAddForm((p) => ({ ...p, mood: e.target.value }))} />
              </label>

              <label className="pp-label">
                Sort order
                <input className="pp-input" value={addForm.sort_order} onChange={(e) => setAddForm((p) => ({ ...p, sort_order: e.target.value }))} />
              </label>

              <label className="pp-label" style={{ gridColumn: "1 / -1" }}>
                Dominant terpenes (comma-separated)
                <input className="pp-input" value={addForm.dominant_terpenes_csv} onChange={(e) => setAddForm((p) => ({ ...p, dominant_terpenes_csv: e.target.value }))} />
              </label>

              <label className="pp-label" style={{ gridColumn: "1 / -1" }}>
                Flavor and aroma (comma-separated)
                <input className="pp-input" value={addForm.flavor_aroma_csv} onChange={(e) => setAddForm((p) => ({ ...p, flavor_aroma_csv: e.target.value }))} />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button type="button" className="pp-docBtn" onClick={() => setShowAddProfile(false)}>Cancel</button>
              <button type="button" className="pp-primaryBtn" onClick={createProfile} disabled={addProfileSaving}>
                {addProfileSaving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <AdminEditProfileModal
          open={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          initialProfile={profileBundle?.profile || null}
          initialImages={Array.isArray(profileBundle?.images) ? profileBundle.images : []}
          onSave={async (payload) => {
            if (!selectedSlug || !collection?.id) throw new Error("No profile selected.");
            await fetchJson(`/api/profiles/${encodeURIComponent(selectedSlug)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const refreshed = await fetchJson(`/api/profiles/${encodeURIComponent(selectedSlug)}`);
            setProfileBundle(refreshed);
            await loadCollectionAndProfiles(collection.id, { preserveSelection: true });
          }}
        />
      )}
    </>
  );
}
