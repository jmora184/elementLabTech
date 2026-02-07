import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { terpeneCollections } from "../TerpeneShowcase/terpenesData";
import "./ProductPage.css";
import AdminEditProfileModal from "./AdminEditProfileModal";
// Header is provided globally by SiteLayout.

import bottleImg from "../../assets/bottle.png";
import dt2 from "../../assets/dominant-terpenes-2.png";
import dt3 from "../../assets/dominant-terpenes-3.png";

import { uploadImageFile } from "../../utils/cloudflareImages";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const parseJsonArray = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    const v = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
};

const collectionDocDownloadUrl = (collectionId, doc) => {
  const cid = encodeURIComponent(collectionId || "");
  const did = encodeURIComponent(doc?.id || "");
  if (did) return `/api/collections/${cid}/documents/${did}/download`;
  return String(doc?.url || "");
};

async function uploadCollectionDocument(collectionId, file, { title = "", type = "" } = {}) {
  const cid = encodeURIComponent(collectionId || "");
  const fd = new FormData();
  fd.append("file", file);
  if (title) fd.append("title", title);
  if (type) fd.append("type", type);
  return await fetchJson(`/api/collections/${cid}/documents/upload`, { method: "POST", body: fd });
}

async function deleteCollectionDocument(collectionId, docId) {
  const cid = encodeURIComponent(collectionId || "");
  const did = encodeURIComponent(docId || "");
  return await fetchJson(`/api/collections/${cid}/documents/${did}`, { method: "DELETE" });
}

function Stars({ value = 4.8 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const isFull = i < full;
    const isHalf = i === full && half;
    return (
      <span key={i} className="pp-star" aria-hidden="true">
        {isFull ? "*" : isHalf ? "*" : "."}
      </span>
    );
  });
  return <span className="pp-stars">{stars}</span>;
}


export default function ProductPage() {

  // Admin: edit core collection fields (name/tagline/description/etc.)
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editCollectionSaving, setEditCollectionSaving] = useState(false);
  const [editCollectionError, setEditCollectionError] = useState("");
  const [editCollectionForm, setEditCollectionForm] = useState({
    name: "",
    tagline: "",
    description: "",
    badge: "",
    sort_order: 0,
    is_active: true,
  });

  // Admin: edit per-tab content (Specs/Documents/Reviews/Shipping/Isolates/Terpenes) + Images
  const [editTabOpen, setEditTabOpen] = useState(false);
  const [editTabSaving, setEditTabSaving] = useState(false);
  const [editTabError, setEditTabError] = useState("");
  const [editTabKey, setEditTabKey] = useState(""); // e.g. "Specs" | "Documents" | "Shipping" | "Images"
  const [editRows, setEditRows] = useState([]); // array for row-based tabs
  const [editText, setEditText] = useState(""); // textarea for Shipping
  const navigate = useNavigate();
  const { id } = useParams();

  // Fallback: still supports hardcoded collections while we migrate the UI.
  const hardcodedCollection = useMemo(
    () => terpeneCollections.find((c) => c.id === id),
    [id]
  );

  // DB-backed collection + profiles (new)
  const [dbCollection, setDbCollection] = useState(null);
  const [dbProfiles, setDbProfiles] = useState([]); // array of profile rows
  const [selectedSlug, setSelectedSlug] = useState("");
  const [expandedSlug, setExpandedSlug] = useState("");
  const [profileBundle, setProfileBundle] = useState(null); // { profile, images, documents }
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Auth for admin UI
  const [me, setMe] = useState(null);
  const isAdmin = me?.role === "admin";

  // Admin: Add Profile modal state
  const [showAdd, setShowAdd] = useState(false);
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
  const [addProfileImages, setAddProfileImages] = useState([]); // [{ url, alt, kind }]
  const [addProfileImgBusy, setAddProfileImgBusy] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [adding, setAdding] = useState(false);

  async function refreshProfiles() {
    if (!id) return;
    const list = await fetchJson(`/api/collections/${encodeURIComponent(id)}/profiles`);
    const profiles = Array.isArray(list?.profiles) ? list.profiles : [];
    setDbProfiles(profiles);
    if (profiles.length) {
      const still = profiles.find((p) => p.slug === selectedSlug);
      const first = profiles[0]?.slug || "";
      if (!still) {
        setSelectedSlug(first);
        setExpandedSlug(first);
      }
    }
  }

  async function uploadFilesToRows(files, { setRows, setBusy, setErr, metadata }) {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return;
    setErr?.("");
    setBusy?.(true);
    try {
      for (const file of list) {
        const out = await uploadImageFile(file, { metadata });
        if (!out?.url) throw new Error("Upload succeeded but no delivery URL was returned.");
        setRows((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          next.push({ url: out.url, alt: "", kind: "gallery" });
          return next;
        });
      }
    } catch (e) {
      setErr?.(e?.message || "Image upload failed.");
    } finally {
      setBusy?.(false);
    }
  }

  async function createProfile() {
    setAddErr("");
    const name = addForm.name.trim();
    if (!name) {
      setAddErr("Name is required.");
      return;
    }
    setAdding(true);
    try {
      const payload = {
        name,
        slug: addForm.slug.trim() || undefined,
        flavor_type: addForm.flavor_type.trim() || undefined,
        flavor_category: addForm.flavor_category.trim() || undefined,
        description: addForm.description.trim() || undefined,
        mood: addForm.mood.trim() || undefined,
        dominant_terpenes: addForm.dominant_terpenes_csv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        flavor_aroma: addForm.flavor_aroma_csv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        sort_order: addForm.sort_order === "" ? undefined : Number(addForm.sort_order),
        images: Array.isArray(addProfileImages)
          ? addProfileImages
              .filter((x) => x && typeof x.url === "string" && x.url.trim())
              .map((x, idx) => ({
                url: String(x.url).trim(),
                alt: String(x.alt || "").trim(),
                kind: String(x.kind || "gallery").trim() || "gallery",
                sort_order: idx,
              }))
          : [],
      };

      const res = await fetchJson(`/api/collections/${encodeURIComponent(id)}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = res?.profile;
      await refreshProfiles();

      if (created?.slug) {
        setSelectedSlug(created.slug);
        setExpandedSlug(created.slug);
      }

      setShowAdd(false);
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
      setAddProfileImages([]);
    } catch (err) {
      setAddErr(err?.message || "Could not create profile.");
    } finally {
      setAdding(false);
    }
  }

  // Admin: Edit Profile
  const [showEdit, setShowEdit] = useState(false);

  async function saveProfileEdits(payload) {
    if (!selectedSlug) {
      throw new Error("No profile selected.");
    }

    await fetchJson(`/api/profiles/${encodeURIComponent(selectedSlug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Refresh bundle so UI updates
    const bundle = await fetchJson(`/api/profiles/${encodeURIComponent(selectedSlug)}`);
    setProfileBundle(bundle);

    // Refresh list (in case name/order changed)
    await refreshProfiles();
  }

// Load current user (role comes from /api/auth/me)
  useEffect(() => {
    let alive = true;
    fetchJson("/api/auth/me")
      .then((d) => {
        if (!alive) return;
        setMe(d?.user || null);
      })
      .catch(() => {
        if (!alive) return;
        setMe(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Load collection + profile list from DB for this product id
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;
      setLoadingProfiles(true);
      setDbCollection(null);
      setDbProfiles([]);
      setSelectedSlug("");
      setExpandedSlug("");
      setProfileBundle(null);

      try {
        const col = await fetchJson(`/api/collections/${encodeURIComponent(id)}`);
        if (!alive) return;
        setDbCollection(col?.collection || null);

        const list = await fetchJson(`/api/collections/${encodeURIComponent(id)}/profiles`);
        if (!alive) return;

        const profiles = Array.isArray(list?.profiles) ? list.profiles : [];
        setDbProfiles(profiles);

        const first = profiles[0]?.slug || "";
        setSelectedSlug(first);
        setExpandedSlug(first);
      } catch (err) {
        // DB not ready / not seeded / endpoint missing: fall back to hardcoded UI
        console.warn("DB collection/profiles load failed, falling back to hardcoded:", err?.message || err);
      } finally {
        if (alive) setLoadingProfiles(false);
      }
    }

    load();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      alive = false;
    };
  }, [id]);

  // Load the selected profile details bundle
  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      if (!selectedSlug) return;
      setLoadingProfile(true);
      try {
        const bundle = await fetchJson(`/api/profiles/${encodeURIComponent(selectedSlug)}`);
        if (!alive) return;
        setProfileBundle(bundle);
      } catch (err) {
        console.warn("Profile bundle load failed:", err?.message || err);
        if (alive) setProfileBundle(null);
      } finally {
        if (alive) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      alive = false;
    };
  }, [selectedSlug]);

  // Use DB collection when present, otherwise fallback to hardcoded
  const collection = dbCollection || hardcodedCollection;

  // Gallery: use DB images_json when available (R2 URLs), fallback to local placeholders
  const galleryImages = useMemo(() => {
    const rows = parseJsonArray(collection?.images_json, []);
    // Put the "primary" image first (while preserving order of the others)
    const primaryIdx = rows.findIndex((r) => !!r?.isPrimary);
    const ordered =
      primaryIdx >= 0 ? [rows[primaryIdx], ...rows.filter((_, i) => i !== primaryIdx)] : rows;

    const urls = ordered.map((r) => String(r?.url || "")).filter(Boolean);
    return urls.length ? urls : [bottleImg, dt2, dt3];
  }, [collection?.images_json]);
  const [activeImg, setActiveImg] = useState(0);

  // Whenever the images change (or primary changes), show the primary image first
  useEffect(() => {
    setActiveImg(0);
  }, [collection?.images_json]);

  // Variant-ish selections
  const hardcodedProfiles = useMemo(() => collection?.profiles ?? [], [collection?.profiles]);
  const profileDisplayRows = dbProfiles.length
    ? dbProfiles.map((p) => ({ slug: p.slug, label: p.name || p.slug }))
    : hardcodedProfiles.map((name) => ({ slug: name, label: name })); // fallback uses name as slug too (until fully migrated)

  // If we're in fallback mode, keep the previous behavior:
  const [fallbackProfile, setFallbackProfile] = useState(hardcodedProfiles[0] ?? "");
  useEffect(() => {
    setFallbackProfile(hardcodedProfiles[0] ?? "");
  }, [id, hardcodedProfiles]); // reset on route change

  // Tabs (middle column)
  const tabs = ["Details", "Specs", "Documents", "Reviews", "Shipping", "Isolates", "Terpenes"];
  const [tab, setTab] = useState("Details");

  // Flavor info: DB-backed when available; otherwise show the old placeholder
  const dbProfile = profileBundle?.profile || null;

  const profileImages = useMemo(() => {
    const rows = Array.isArray(profileBundle?.images) ? profileBundle.images : [];
    const urls = rows.map((r) => String(r?.url || "")).filter(Boolean);
    return urls.length ? urls : [dt2];
  }, [profileBundle?.images]);
  const [profileActiveImg, setProfileActiveImg] = useState(0);
  useEffect(() => {
    setProfileActiveImg(0);
  }, [selectedSlug]);

  const flavorInfo = useMemo(() => {
    if (dbProfile) {
      return {
        intro: collection?.description || "",
        flavorType: dbProfile.flavor_type || dbProfile.name || "",
        flavorCategory: dbProfile.flavor_category || "",
        name: dbProfile.name || "",
        description: dbProfile.description || "",
        dominantTerpenes: Array.isArray(dbProfile.dominant_terpenes) ? dbProfile.dominant_terpenes : [],
        flavorAroma: Array.isArray(dbProfile.flavor_aroma) ? dbProfile.flavor_aroma : [],
        mood: dbProfile.mood || "",
      };
    }

    // Old placeholder (until all profiles are migrated)
    return {
      intro:
        "Matrix offers bold, trendy flavors. Beyond classic fruit notes, each profile delivers vivid bursts of flavor and aroma, crafted to elevate the palate and turn every experience into something extraordinary.",
      flavorType: "Green Jelly Rancher",
      flavorCategory: "Candy",
      name: "Green Jelly Rancher",
      description:
        "Green Jelly Rancher explodes with a tangy, sour-sweet symphony. Zesty green apple and juicy melon mingle with candy-like notes, finishing with a bright, puckering sour kick that makes every sip lively and unforgettable.",
      dominantTerpenes: ["Ethyl Maltol", "Geraniol", "Linalool", "Beta-Caryophyllene"],
      flavorAroma: ["candy", "sweet", "sour", "green apple"],
      mood: "Uplift Inspired",
    };
  }, [dbProfile, collection?.description]);

  // Reviews: read from DB-backed reviews_json (editable via admin modal)
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    setReviews(parseJsonArray(collection?.reviews_json, []));
  }, [collection?.reviews_json]);

  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, text: "" });

  const avgRating = useMemo(() => {
    if (!reviews.length) return 4.8;
    const s = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

  const addReview = (e) => {
    e.preventDefault();
    const next = [
      {
        name: reviewForm.name || "Anonymous",
        rating: Number(reviewForm.rating) || 5,
        text: reviewForm.text || "",
        at: new Date().toISOString(),
      },
      ...reviews,
    ];
    setReviews(next);
        setReviewForm({ name: "", rating: 5, text: "" });
    setTab("Reviews");
  };

  // Collection-level tab content from DB
  const specsRows = useMemo(() => parseJsonArray(collection?.specs_json, []), [collection?.specs_json]);
  const documentsRows = useMemo(() => parseJsonArray(collection?.documents_json, []), [collection?.documents_json]);
  const isolatesRows = useMemo(() => parseJsonArray(collection?.isolates_json, []), [collection?.isolates_json]);
  const terpenesRows = useMemo(() => parseJsonArray(collection?.terpenes_json, []), [collection?.terpenes_json]);
  const shippingText = useMemo(() => {
    const text = String(collection?.shipping_md || "").trim();
    return text || "Fast, discreet shipping. Orders typically process in 1–2 business days.";
  }, [collection?.shipping_md]);

  if (!collection) {
    return (
      <>
        <div className="pp-page">
        <main className="pp-container">
          <div className="pp-card">
            <h1 className="pp-h1">Product not found</h1>
            <p className="pp-muted">That product id doesn’t match a collection.</p>
            <button className="pp-primaryBtn" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        </main>
      </div>
      </>
    );
  }

  // Admin: edit core collection fields
  const openEditCollection = () => {
    if (!collection) return;
    setEditCollectionError("");
    setEditCollectionForm({
      name: collection.name || "",
      tagline: collection.tagline || "",
      description: collection.description || "",
      badge: collection.badge || "",
      sort_order: Number(collection.sort_order ?? 0),
      is_active: (collection.is_active ?? 1) ? true : false,
    });
    setEditCollectionOpen(true);
  };

  const saveEditCollection = async () => {
    if (!collection?.id) return;
    setEditCollectionSaving(true);
    setEditCollectionError("");
    try {
      const data = await fetchJson(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCollectionForm.name,
          tagline: editCollectionForm.tagline,
          description: editCollectionForm.description,
          badge: editCollectionForm.badge,
          sort_order: Number(editCollectionForm.sort_order ?? 0),
          is_active: editCollectionForm.is_active ? 1 : 0,
        }),
      });
      if (data?.collection) {
        setDbCollection(data.collection);
      }
      setEditCollectionOpen(false);
    } catch (e) {
      setEditCollectionError(e?.message || "Failed to save.");
    } finally {
      setEditCollectionSaving(false);
    }
  };

  const openTabEditor = (key) => {
    if (!collection) return;
    setEditTabError("");
    setEditTabKey(key);

    if (key === "Shipping") {
      setEditText(String(collection.shipping_md || ""));
      setEditRows([]);
    } else if (key === "Specs") {
      const rows = parseJsonArray(collection.specs_json, []).map((r) => ({
        label: String(r?.label || ""),
        value: String(r?.value || ""),
      }));
      setEditRows(rows.length ? rows : [{ label: "", value: "" }]);
      setEditText("");
    } else if (key === "Documents") {
      const rows = parseJsonArray(collection.documents_json, []).map((r) => {
        const id = String(r?.id || "").trim();
        const key = String(r?.key || "").trim();
        const url = String(r?.url || "").trim() || (id ? collectionDocDownloadUrl(collection.id, { id }) : "");
        return {
          id,
          key,
          title: String(r?.title || ""),
          type: String(r?.type || ""),
          url,
          fileName: String(r?.fileName || ""),
          contentType: String(r?.contentType || ""),
          size: r?.size ?? "",
          created_at: String(r?.created_at || ""),
        };
      });
      setEditRows(
        rows.length ? rows : [{ id: "", key: "", title: "", type: "", url: "", fileName: "", contentType: "", size: "", created_at: "" }]
      );
      setEditText("");
    } else if (key === "Reviews") {
      const rows = parseJsonArray(collection.reviews_json, []).map((r) => ({
        author: String(r?.author || ""),
        rating: Number(r?.rating ?? 5),
        text: String(r?.text || ""),
      }));
      setEditRows(rows.length ? rows : [{ author: "", rating: 5, text: "" }]);
      setEditText("");
    } else if (key === "Isolates") {
      const rows = parseJsonArray(collection.isolates_json, []).map((r) => ({
        name: String(r?.name || ""),
        percent: r?.percent === null || typeof r?.percent === "undefined" ? "" : String(r.percent),
      }));
      setEditRows(rows.length ? rows : [{ name: "", percent: "" }]);
      setEditText("");
    } else if (key === "Terpenes") {
      const rows = parseJsonArray(collection.terpenes_json, []).map((r) => ({
        name: String(r?.name || ""),
        percent: r?.percent === null || typeof r?.percent === "undefined" ? "" : String(r.percent),
      }));
      setEditRows(rows.length ? rows : [{ name: "", percent: "" }]);
      setEditText("");
    } else if (key === "Images") {
      const rows = parseJsonArray(collection.images_json, []).map((r) => ({
        url: String(r?.url || ""),
        alt: String(r?.alt || ""),
        isPrimary: !!r?.isPrimary,
      }));
      setEditRows(rows.length ? rows : [{ url: "", alt: "", isPrimary: true }]);
      setEditText("");
    } else {
      setEditRows([]);
      setEditText("");
    }

    setEditTabOpen(true);
  };

  const addRow = () => {
    setEditRows((prev) => {
      const key = editTabKey;
      if (key === "Specs") return [...prev, { label: "", value: "" }];
      if (key === "Documents") return [...prev, { id: "", key: "", title: "", type: "", url: "", fileName: "", contentType: "", size: "", created_at: "" }];
      if (key === "Reviews") return [...prev, { author: "", rating: 5, text: "" }];
      if (key === "Isolates" || key === "Terpenes") return [...prev, { name: "", percent: "" }];
      if (key === "Images") return [...prev, { url: "", alt: "", isPrimary: prev.length === 0 }];
      return prev;
    });
  };

  const removeRow = (idx) => {
    setEditRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : prev;
    });
  };

  const saveTab = async () => {
    if (!collection?.id) return;
    setEditTabSaving(true);
    setEditTabError("");

    try {
      const payload = {};
      const key = editTabKey;

      if (key === "Shipping") {
        payload.shipping_md = editText;
      } else if (key === "Specs") {
        const cleaned = editRows
          .map((r) => ({ label: String(r.label || "").trim(), value: String(r.value || "").trim() }))
          .filter((r) => r.label || r.value);
        payload.specs_json = JSON.stringify(cleaned);
      } else if (key === "Documents") {
        const cleaned = editRows
          .map((r) => {
            const title = String(r.title || "").trim();
            const type = String(r.type || "").trim();
            const id = String(r.id || "").trim();
            const key = String(r.key || "").trim();
            const url = String(r.url || "").trim();

            // R2-backed document (preferred)
            if (id && key) {
              return {
                id,
                key,
                title: title || String(r.fileName || "Document"),
                type,
                fileName: String(r.fileName || ""),
                contentType: String(r.contentType || ""),
                size: r.size ?? null,
                created_at: String(r.created_at || ""),
              };
            }

            // Legacy/external link support
            if (title || url) {
              return { title, url, type };
            }
            return null;
          })
          .filter(Boolean);
        payload.documents_json = JSON.stringify(cleaned);
      } else if (key === "Reviews") {
        const cleaned = editRows
          .map((r) => ({
            author: String(r.author || "").trim(),
            rating: Number(r.rating ?? 5),
            text: String(r.text || "").trim(),
          }))
          .filter((r) => r.author || r.text);
        payload.reviews_json = JSON.stringify(cleaned);
      } else if (key === "Isolates") {
        const cleaned = editRows
          .map((r) => ({
            name: String(r.name || "").trim(),
            percent: r.percent === "" ? null : Number(r.percent),
          }))
          .filter((r) => r.name);
        payload.isolates_json = JSON.stringify(cleaned);
      } else if (key === "Terpenes") {
        const cleaned = editRows
          .map((r) => ({
            name: String(r.name || "").trim(),
            percent: r.percent === "" ? null : Number(r.percent),
          }))
          .filter((r) => r.name);
        payload.terpenes_json = JSON.stringify(cleaned);
      } else if (key === "Images") {
        let primaryFound = false;
        const cleaned = editRows
          .map((r) => {
            const url = String(r.url || "").trim();
            const alt = String(r.alt || "").trim();
            let isPrimary = !!r.isPrimary;
            if (isPrimary && !primaryFound) primaryFound = true;
            else if (isPrimary && primaryFound) isPrimary = false;
            return { url, alt, isPrimary };
          })
          .filter((r) => r.url);

        if (cleaned.length && !cleaned.some((x) => x.isPrimary)) {
          cleaned[0].isPrimary = true;
        }
        payload.images_json = JSON.stringify(cleaned);
      }

      const data = await fetchJson(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (data?.collection) {
        setDbCollection(data.collection);
      }

      setEditTabOpen(false);
    } catch (e) {
      setEditTabError(e?.message || "Failed to save.");
    } finally {
      setEditTabSaving(false);
    }
  };


  return (
    <>
      <div className="pp-page">
        <main className="pp-container">
          <div className="pp-topGrid">
          {/* LEFT: Images (smaller column) */}
          <section className="pp-card pp-galleryCard" aria-label="Product images">
            <div className="pp-galleryMain">
              <img src={galleryImages[activeImg]} className="pp-mainImg" />
            </div>

            <div className="pp-thumbRow" role="list" aria-label="Image thumbnails">
              {galleryImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pp-thumb ${i === activeImg ? "isActive" : ""}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>

            <div className="pp-galleryMeta">
                {isAdmin && (
                  <div style={{ marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => openTabEditor("Images")}
                      style={{
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.25)",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      Edit Images
                    </button>
                  </div>
                )}

              <div className="pp-collectionName">{collection.name}</div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={openEditCollection}
                  style={{
                    marginTop: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.25)",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  Edit Collection
                </button>
              )}
              <div className="pp-body">{flavorInfo.intro}</div>
              <br></br>
              <div className="pp-muted">{collection.tagline}</div>
              <div className="pp-galleryMeta">
                <p className="pp-body">{collection.description}</p>
              </div>
            </div>
          </section>

          {/* MIDDLE: Details / Docs / Info (tabs) */}
          <section className="pp-card pp-infoCard" aria-label="Details and information">
            <div className="pp-tabBar" role="tablist" aria-label="Product tabs">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  className={`pp-tabBtn ${tab === t ? "isActive" : ""}`}
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            
              {isAdmin && tab !== "Details" && (
                <button
                  type="button"
                  onClick={() => openTabEditor(tab)}
                  style={{
                    marginLeft: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.25)",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  Edit {tab}
                </button>
              )}
</div>

            <div className="pp-tabPanel" role="tabpanel">
              {tab === "Details" && (
                <>
                  {/* Flavor info */}
                  {(expandedSlug || expandedSlug === selectedSlug || expandedSlug) && (
                    <div className="pp-ingredients pp-flavorInfo" aria-live="polite">
                      <div className="pp-flavorTitle">
                        {flavorInfo.flavorType}
                        {flavorInfo.flavorCategory ? ` (${flavorInfo.flavorCategory})` : ""}
                      </div>

                      {/* Flavor profile images */}
                      <img
                        src={profileImages[profileActiveImg] || dt2}
                        alt={flavorInfo.name}
                        className="pp-flavorHero"
                      />

                      {profileImages.length > 1 && (
                        <div className="pp-thumbRow" style={{ marginTop: 10 }}>
                          {profileImages.map((src, idx) => (
                            <button
                              key={src + idx}
                              type="button"
                              className={`pp-thumb ${idx === profileActiveImg ? "isActive" : ""}`}
                              onClick={() => setProfileActiveImg(idx)}
                              aria-label={`View profile image ${idx + 1}`}
                            >
                              <img src={src} alt="" />
                            </button>
                          ))}
                        </div>
                      )}

                      {loadingProfile && (
                        <div className="pp-muted" style={{ marginTop: 10 }}>
                          Loading profile…
                        </div>
                      )}

                      <div className="pp-flavorTableWrap" aria-label="Flavor info table">
                        <div className="pp-tableScroll">
                          <table className="pp-flavorTable">
                            <thead>
                              <tr>
                                <th>
                                  <span className="pp-thWithIcon">
                                    <span className="pp-thIcon" aria-hidden="true">
                                      <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        focusable="false"
                                        aria-hidden="true"
                                      >
                                        <path
                                          fill="currentColor"
                                          d="M7.3 6.2c1.1-1.7 3-2.9 4.7-2.9s3.6 1.2 4.7 2.9c.6 1 1.2 1.7 2.6 2.3c.5.2.8.7.7 1.2c-.3 1.6-1.3 2.5-2.1 3.1c-.4.3-.7.6-.9.9c-.4.6-.5 1.3-.4 2.3c.1 1-.1 2-.9 2.8c-.9.9-2.3 1.2-4 1.2s-3.1-.3-4-1.2c-.8-.8-1-1.8-.9-2.8c.1-1-.1-1.7-.4-2.3c-.2-.3-.5-.6-.9-.9c-.8-.6-1.8-1.5-2.1-3.1c-.1-.5.2-1 .7-1.2c1.4-.6 2-.3 2.6-2.3Z"
                                          opacity="0.25"
                                        />
                                        <path
                                          fill="currentColor"
                                          d="M9.2 6.8c.8-1.2 2-2 2.8-2s2 .8 2.8 2c.5.8 1 1.3 2 1.8c.2.1.3.3.3.5c-.2 1-.8 1.6-1.4 2c-.5.4-1 .8-1.3 1.4c-.6 1.1-.5 2.2-.4 3.1c.1.8 0 1.2-.3 1.6c-.5.5-1.6.8-3.1.8s-2.6-.3-3.1-.8c-.3-.4-.4-.8-.3-1.6c.1-.9.2-2-.4-3.1c-.3-.6-.8-1-1.3-1.4c-.6-.4-1.2-1-1.4-2c0-.2.1-.4.3-.5c1-.5 1.5-1 2-1.8Z"
                                        />
                                      </svg>
                                    </span>
                                    Natural flavor
                                  </span>
                                </th>
                                <th>Description under Flavor Name</th>
                                <th>Dominant terpenes</th>
                                <th>Flavor and aroma</th>
                                <th>Mood</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="pp-tdStrong" data-label="Natural flavor">
                                  {flavorInfo.flavorType}
                                  {flavorInfo.flavorCategory ? ` (${flavorInfo.flavorCategory})` : ""}
                                </td>
                                <td className="pp-tdDesc" data-label="Description under Flavor Name">
                                  {flavorInfo.description}
                                </td>
                                <td data-label="Dominant terpenes">
                                  <div className="pp-cellList">
                                    {(flavorInfo.dominantTerpenes || []).map((t) => (
                                      <span key={t} className="pp-cellPill">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td data-label="Flavor and aroma">
                                  <div className="pp-cellList">
                                    {(flavorInfo.flavorAroma || []).map((note) => (
                                      <span key={note} className="pp-cellPill">
                                        {note}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td data-label="Mood">
                                  <span style={{ color: "#eab308", fontWeight: 700 }}>{flavorInfo.mood}</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Flavor profiles list */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <h3 className="pp-h3" style={{ margin: 0 }}>Flavor Profiles</h3>

                    {isAdmin && (
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                        type="button"
                        className="pp-primaryBtn"
                        style={{ padding: "8px 12px", fontSize: 14 }}
                        onClick={() => { setShowAdd(true); setAddErr(""); }}
                        aria-label="Add flavor profile"
                      >
                        + Add
                      </button>

                        {selectedSlug && (
                          <button
                            type="button"
                            className="pp-primaryBtn"
                            style={{ padding: "8px 12px", fontSize: 14 }}
                            onClick={() => setShowEdit(true)}
                            aria-label="Edit selected flavor profile"
                          >
                            Edit
                          </button>
                        )}

                      {/* Admin-only Edit button (edits selected profile) */}
                     
                      </div>
                    )}
                  </div>

                  {loadingProfiles && (
                    <div className="pp-muted" style={{ marginTop: 10 }}>
                      Loading profiles…
                    </div>
                  )}

                  <div className="pp-chipGrid">
                    {profileDisplayRows.map((p) => {
                      const isActive = dbProfiles.length ? p.slug === selectedSlug : p.label === fallbackProfile;
                      return (
                        <button
                          key={p.slug}
                          type="button"
                          className={`pp-chip ${isActive ? "isActive" : ""}`}
                          onClick={() => {
                            if (dbProfiles.length) {
                              setSelectedSlug(p.slug);
                              setExpandedSlug((prev) => (prev === p.slug ? "" : p.slug));
                            } else {
                              setFallbackProfile(p.label);
                            }
                          }}
                          aria-label={`Select profile ${p.label}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>


                  {/* Admin Add Profile Modal */}
                  {showAdd && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="Add flavor profile"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) setShowAdd(false);
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
                          background: "#0b1220",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 16,
                          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                          padding: 16,
                          maxHeight: "85vh",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <h3 className="pp-h3" style={{ margin: 0 }}>Add Flavor Profile</h3>
                          <button
                            type="button"
                            className="pp-qtyBtn"
                            onClick={() => setShowAdd(false)}

                            aria-label="Close"
                            style={{ width: 36, height: 36 }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ marginTop: 12, overflowY: "auto", paddingRight: 6, flex: "1 1 auto", minHeight: 0 }}>
                          <p className="pp-muted" style={{ marginTop: 6 }}>
                            This creates a new profile in D1 (images/documents next).
                          </p>

                        {addErr && (
                          <div
                            style={{
                              marginTop: 10,
                              background: "rgba(239,68,68,0.12)",
                              border: "1px solid rgba(239,68,68,0.35)",
                              color: "#fecaca",
                              padding: "10px 12px",
                              borderRadius: 12,
                            }}
                          >
                            {addErr}
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                          <label className="pp-label">
                            Name *
                            <input
                              className="pp-input"
                              value={addForm.name}
                              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Blazin Banana"
                            />
                          </label>

                          <label className="pp-label">
                            Slug (optional)
                            <input
                              className="pp-input"
                              value={addForm.slug}
                              onChange={(e) => setAddForm((p) => ({ ...p, slug: e.target.value }))}
                              placeholder="blazin-banana"
                            />
                          </label>

                          <label className="pp-label">
                            Flavor type
                            <input
                              className="pp-input"
                              value={addForm.flavor_type}
                              onChange={(e) => setAddForm((p) => ({ ...p, flavor_type: e.target.value }))}
                              placeholder="Fruit / Candy"
                            />
                          </label>

                          <label className="pp-label">
                            Flavor category
                            <input
                              className="pp-input"
                              value={addForm.flavor_category}
                              onChange={(e) => setAddForm((p) => ({ ...p, flavor_category: e.target.value }))}
                              placeholder="Candy"
                            />
                          </label>

                          <label className="pp-label" style={{ gridColumn: "1 / -1" }}>
                            Description
                            <textarea
                              className="pp-textarea"
                              rows={3}
                              value={addForm.description}
                              onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                              placeholder="A bold banana-candy forward profile..."
                            />
                          </label>

                          <label className="pp-label" style={{ gridColumn: "1 / -1" }}>
                            Upload images (optional)
                            <input
                              className="pp-input"
                              type="file"
                              multiple
                              accept="image/*"
                              disabled={addProfileImgBusy}
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                e.target.value = "";
                                if (!files.length) return;
                                await uploadFilesToRows(files, {
                                  setRows: setAddProfileImages,
                                  setBusy: setAddProfileImgBusy,
                                  setErr: setAddErr,
                                  metadata: { purpose: "flavor_profile", collection_id: id, slug: addForm.slug || addForm.name },
                                });
                              }}
                            />
                            <div className="pp-muted" style={{ marginTop: 6 }}>
                              Pick files from your device (or drag-select multiple). They’ll upload to Cloudflare Images.
                            </div>

                            {!!addProfileImages.length && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                                {addProfileImages.map((img, idx) => (
                                  <div key={idx} style={{ display: "grid", gap: 6, width: 160 }}>
                                    <img
                                      src={img.url}
                                      alt={img.alt || ""}
                                      style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
                                    />
                                    <input
                                      className="pp-input"
                                      placeholder="Alt text"
                                      value={img.alt || ""}
                                      onChange={(e) =>
                                        setAddProfileImages((p) => p.map((r, i) => (i === idx ? { ...r, alt: e.target.value } : r)))
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="pp-docBtn"
                                      onClick={() => setAddProfileImages((p) => p.filter((_, i) => i !== idx))}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </label>

                          <label className="pp-label">
                            Mood
                            <input
                              className="pp-input"
                              value={addForm.mood}
                              onChange={(e) => setAddForm((p) => ({ ...p, mood: e.target.value }))}
                              placeholder="Euphoric / Uplifting"
                            />
                          </label>

                          <label className="pp-label">
                            Sort order (optional)
                            <input
                              className="pp-input"
                              inputMode="numeric"
                              value={addForm.sort_order}
                              onChange={(e) => setAddForm((p) => ({ ...p, sort_order: e.target.value }))}
                              placeholder="10"
                            />
                          </label>

                          <label className="pp-label" style={{ gridColumn: "1 / -1" }}>
                            Dominant terpenes (comma-separated)
                            <input
                              className="pp-input"
                              value={addForm.dominant_terpenes_csv}
                              onChange={(e) => setAddForm((p) => ({ ...p, dominant_terpenes_csv: e.target.value }))}
                              placeholder="Isoamyl acetate, Ethyl maltol"
                            />
                          </label>

                          <label className="pp-label" style={{ gridColumn: "1 / -1" }}>
                            Flavor & aroma (comma-separated)
                            <input
                              className="pp-input"
                              value={addForm.flavor_aroma_csv}
                              onChange={(e) => setAddForm((p) => ({ ...p, flavor_aroma_csv: e.target.value }))}
                              placeholder="banana, candy, sweet"
                            />
                          </label>
                        </div>

                        </div>

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.12)", marginTop: 12 }}>
                          <button type="button" className="pp-docBtn" onClick={() => setShowAdd(false)}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="pp-primaryBtn"
                            onClick={createProfile}
                            disabled={adding}
                          >
                            {adding ? "Creating…" : "Create profile"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <AdminEditProfileModal
                  open={showEdit}
                  onClose={() => setShowEdit(false)}
                  initialProfile={dbProfile}
                  initialImages={Array.isArray(profileBundle?.images) ? profileBundle.images : []}
                  onSave={async (payload) => {
                    await saveProfileEdits(payload);
                    setShowEdit(false);
                  }}
                />


                </>
              )}

              {tab === "Specs" && (
                <>
                  <h2 className="pp-h2">Specs</h2>

                  {specsRows.length ? (
                    <table className="pp-specTable">
                      <tbody>
                        {specsRows.map((r, idx) => {
                          const label = String(r?.label ?? r?.name ?? r?.key ?? "").trim();
                          const value = String(r?.value ?? r?.val ?? r?.text ?? r?.percent ?? "").trim();
                          if (!label && !value) return null;
                          return (
                            <tr key={idx}>
                              <th>{label || "Spec"}</th>
                              <td>{value}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="pp-muted">No specs have been added yet.</p>
                  )}
                </>
              )}

              {tab === "Documents" && (
                <>
                  <h2 className="pp-h2">Documents</h2>

                  {documentsRows.length ? (
                    <div className="pp-docList">
                      {documentsRows.map((d, idx) => {
                        const href = String(d?.url || "").trim() || collectionDocDownloadUrl(collection?.id, d);
                        if (!href) return null;
                        return (
                          <a
                            key={d.id || d.url || idx}
                            className="pp-docBtn"
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {d.title || d.name || d.fileName || "Document"}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pp-muted">No documents have been added yet.</p>
                  )}
                </>
              )}

              {/* The rest of the tabs are unchanged from your existing file */}
              {tab === "Reviews" && (
                <>
                  <div className="pp-reviewHeader">
                    <div>
                      <h2 className="pp-h2" style={{ marginBottom: 6 }}>
                        Customer reviews
                      </h2>
                      <div className="pp-ratingRow">
                        <Stars value={avgRating} />
                        <span className="pp-ratingText">{avgRating} / 5</span>
                        <span className="pp-muted">({reviews.length} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <form className="pp-reviewForm" onSubmit={addReview}>
                    <div className="pp-formRow">
                      <label className="pp-label">
                        Name
                        <input
                          className="pp-input"
                          value={reviewForm.name}
                          onChange={(e) => setReviewForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Your name"
                        />
                      </label>

                      <label className="pp-label">
                        Rating
                        <select
                          className="pp-select"
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                        >
                          {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="pp-label">
                      Review
                      <textarea
                        className="pp-textarea"
                        value={reviewForm.text}
                        onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                        placeholder="Write your review..."
                        rows={4}
                      />
                    </label>

                    <button type="submit" className="pp-primaryBtn">
                      Submit review
                    </button>
                  </form>

                  <div className="pp-reviewList">
                    {reviews.length === 0 ? (
                      <p className="pp-muted">No reviews yet — be the first.</p>
                    ) : (
                      reviews.map((r, idx) => (
                        <div key={idx} className="pp-reviewItem">
                          <div className="pp-reviewTop">
                            <strong>{r.name}</strong>
                            <Stars value={Number(r.rating) || 5} />
                          </div>
                          <div className="pp-muted pp-reviewDate">
                            {r.at ? new Date(r.at).toLocaleString() : ""}
                          </div>
                          <p className="pp-body">{r.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {tab === "Shipping" && (
                <>
                  <h2 className="pp-h2">Shipping</h2>
                  <p className="pp-body">{shippingText}</p>
                </>
              )}

              {tab === "Isolates" && (
                <>
                  <h2 className="pp-h2">Isolates</h2>

                  {isolatesRows.length ? (
                    <div className="pp-list">
                      {isolatesRows.map((r, idx) => {
                        const name = String(r?.name ?? r?.label ?? "").trim();
                        const val = String(r?.percent ?? r?.value ?? r?.amount ?? "").trim();
                        if (!name && !val) return null;
                        return (
                          <div key={idx} className="pp-listRow">
                            <div style={{ fontWeight: 700 }}>{name || "Isolate"}</div>
                            {val ? <div className="pp-muted">{val}</div> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pp-muted">No isolates have been added yet.</p>
                  )}
                </>
              )}

              {tab === "Terpenes" && (
                <>
                  <h2 className="pp-h2">Terpenes</h2>

                  {terpenesRows.length ? (
                    <div className="pp-list">
                      {terpenesRows.map((r, idx) => {
                        const name = String(r?.name ?? r?.label ?? "").trim();
                        const val = String(r?.percent ?? r?.value ?? r?.amount ?? "").trim();
                        if (!name && !val) return null;
                        return (
                          <div key={idx} className="pp-listRow">
                            <div style={{ fontWeight: 700 }}>{name || "Terpene"}</div>
                            {val ? <div className="pp-muted">{val}</div> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pp-muted">No terpenes have been added yet.</p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>

    {editCollectionOpen && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16,
        }}
        onClick={() => setEditCollectionOpen(false)}
      >
        <div
          style={{
            width: "min(820px, 100%)",
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            color: "white",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>Edit Collection</div>
              <div style={{ opacity: 0.75, fontSize: 13 }}>Update collection fields.</div>
            </div>
            <button
              type="button"
              onClick={() => setEditCollectionOpen(false)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.85 }}>Name</label>
              <input
                value={editCollectionForm.name}
                onChange={(e) => setEditCollectionForm((p) => ({ ...p, name: e.target.value }))}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.85 }}>Badge</label>
              <input
                value={editCollectionForm.badge}
                onChange={(e) => setEditCollectionForm((p) => ({ ...p, badge: e.target.value }))}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.85 }}>Tagline</label>
              <input
                value={editCollectionForm.tagline}
                onChange={(e) => setEditCollectionForm((p) => ({ ...p, tagline: e.target.value }))}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.85 }}>Sort order</label>
              <input
                type="number"
                value={editCollectionForm.sort_order}
                onChange={(e) => setEditCollectionForm((p) => ({ ...p, sort_order: e.target.value }))}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            <label style={{ fontSize: 12, opacity: 0.85 }}>Description</label>
            <textarea
              value={editCollectionForm.description}
              onChange={(e) => setEditCollectionForm((p) => ({ ...p, description: e.target.value }))}
              rows={5}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!editCollectionForm.is_active}
                onChange={(e) => setEditCollectionForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              <span style={{ fontSize: 13, opacity: 0.9 }}>Active (show on site)</span>
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setEditCollectionOpen(false)}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditCollection}
                disabled={editCollectionSaving}
                style={{
                  background: "#ff4d2d",
                  border: "none",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: editCollectionSaving ? "not-allowed" : "pointer",
                  fontWeight: 900,
                  opacity: editCollectionSaving ? 0.65 : 1,
                }}
              >
                {editCollectionSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {editCollectionError && (
            <div style={{ marginTop: 10, color: "#ff6b6b", fontWeight: 700, fontSize: 13 }}>
              {editCollectionError}
            </div>
          )}
        </div>
      </div>
    )}

      {/* Admin: Edit Tab Modal */}
      {editTabOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setEditTabOpen(false)}
        >
          <div
            style={{
              width: "min(820px, 100%)",
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              color: "white",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Edit {editTabKey}</div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  {editTabKey === "Shipping"
                    ? "Edit shipping text (markdown/plain)."
                    : editTabKey === "Images"
                    ? "Add image URLs for this collection."
                    : "Add / remove rows. Saved to the collection table."}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTabOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {editTabKey === "Shipping" ? (
              <div style={{ marginTop: 14 }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={10}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.25)",
                    color: "white",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>
            ) : (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  {editTabKey === "Images" && (
                    <div style={{ marginRight: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                      <label style={{ fontSize: 12, opacity: 0.85 }}>
                        Upload images
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={editTabSaving}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            e.target.value = "";
                            if (!files.length) return;
                            setEditTabError("");
                            try {
                              for (const file of files) {
                                const out = await uploadImageFile(file, { metadata: { purpose: "collection", collection_id: id } });
                                if (!out?.url) throw new Error("Upload succeeded but no delivery URL was returned.");
                                setEditRows((prev) => {
                                  const next = Array.isArray(prev) ? [...prev] : [];
                                  const hasPrimary = next.some((r) => !!r?.isPrimary);
                                  next.push({ url: out.url, alt: "", isPrimary: !hasPrimary && next.length === 0 });
                                  return next;
                                });
                              }
                            } catch (ex) {
                              setEditTabError(ex?.message || "Image upload failed.");
                            }
                          }}
                          style={{ display: "block", marginTop: 6 }}
                        />
                      </label>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        (Uploads to Cloudflare Images and stores delivery URLs.)
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={addRow}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.25)",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    + Add Row
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {editRows.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(0,0,0,0.18)",
                      }}
                    >
                      {editTabKey === "Specs" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
                          <input
                            placeholder="Label"
                            value={row.label}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <input
                            placeholder="Value"
                            value={row.value}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            style={{
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                              padding: "10px 12px",
                              borderRadius: 12,
                              cursor: "pointer",
                              fontWeight: 900,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {editTabKey === "Documents" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1.4fr auto", gap: 10, alignItems: "start" }}>
                          <input
                            placeholder="Title"
                            value={row.title}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />

                          <input
                            placeholder="Type (COA, SDS...)"
                            value={row.type}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, type: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />

                          <div style={{ display: "grid", gap: 8 }}>
                            {row?.id && row?.key && (
                              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <a
                                  href={collectionDocDownloadUrl(collection?.id, row)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "white", textDecoration: "underline", fontWeight: 800 }}
                                >
                                  Download
                                </a>
                                <span style={{ fontSize: 12, opacity: 0.75 }}>
                                  {row.fileName || "Stored in R2"}
                                </span>
                              </div>
                            )}

                            <label
                              style={{
                                display: "inline-block",
                                cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(0,0,0,0.25)",
                                color: "white",
                                padding: "10px 12px",
                                borderRadius: 12,
                                fontWeight: 800,
                              }}
                              title="Upload a file to Cloudflare R2"
                            >
                              Upload / Replace file
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  e.target.value = "";
                                  if (!files.length) return;

                                  // If replacing, best-effort delete the old doc to avoid orphaned storage.
                                  if (row?.id && row?.key) {
                                    try {
                                      await deleteCollectionDocument(collection?.id, row.id);
                                    } catch {
                                      // ignore
                                    }
                                  }

                                  setEditTabError("");
                                  try {
                                    const file = files[0];
                                    const out = await uploadCollectionDocument(collection?.id, file, {
                                      title: String(row.title || file.name).trim(),
                                      type: String(row.type || "").trim(),
                                    });

                                    const doc = out?.doc;
                                    if (!doc?.id || !doc?.key) throw new Error("Upload succeeded but no doc id/key returned.");

                                    setEditRows((p) =>
                                      p.map((r, i) =>
                                        i === idx
                                          ? {
                                              ...r,
                                              id: String(doc.id || ""),
                                              key: String(doc.key || ""),
                                              title: String(doc.title || r.title || ""),
                                              type: String(doc.type || r.type || ""),
                                              fileName: String(doc.fileName || file.name || ""),
                                              contentType: String(doc.contentType || file.type || ""),
                                              size: doc.size ?? r.size ?? "",
                                              created_at: String(doc.created_at || r.created_at || ""),
                                              url: String(doc.url || ""),
                                            }
                                          : r
                                      )
                                    );
                                  } catch (ex) {
                                    setEditTabError(ex?.message || "Document upload failed.");
                                  }
                                }}
                                style={{
                                  position: "absolute",
                                  left: -9999,
                                  width: 1,
                                  height: 1,
                                  opacity: 0,
                                }}
                              />
                            </label>

                            {/* Optional: allow external links (legacy support) */}
                            {!row?.key && (
                              <input
                                placeholder="External URL (optional)"
                                value={row.url}
                                onChange={(e) =>
                                  setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))
                                }
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 12,
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  background: "rgba(0,0,0,0.25)",
                                  color: "white",
                                }}
                              />
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              // If stored in R2, delete it too.
                              if (row?.id && row?.key) {
                                try {
                                  await deleteCollectionDocument(collection?.id, row.id);
                                } catch {
                                  // ignore
                                }
                              }
                              removeRow(idx);
                            }}
                            style={{
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                              padding: "10px 12px",
                              borderRadius: 12,
                              cursor: "pointer",
                              fontWeight: 900,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {editTabKey === "Reviews" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.5fr auto", gap: 10 }}>
                          <input
                            placeholder="Author"
                            value={row.author}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, author: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <input
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Rating"
                            value={row.rating}
                            onChange={(e) =>
                              setEditRows((p) =>
                                p.map((r, i) => (i === idx ? { ...r, rating: Number(e.target.value) } : r))
                              )
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            style={{
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                              padding: "10px 12px",
                              borderRadius: 12,
                              cursor: "pointer",
                              fontWeight: 900,
                            }}
                          >
                            ✕
                          </button>

                          <textarea
                            placeholder="Review text"
                            value={row.text}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, text: e.target.value } : r)))
                            }
                            rows={3}
                            style={{
                              gridColumn: "1 / -1",
                              marginTop: 10,
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                              resize: "vertical",
                            }}
                          />
                        </div>
                      )}

                      {(editTabKey === "Isolates" || editTabKey === "Terpenes") && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.5fr auto", gap: 10 }}>
                          <input
                            placeholder="Name"
                            value={row.name}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <input
                            placeholder="% (optional)"
                            value={row.percent}
                            onChange={(e) =>
                              setEditRows((p) =>
                                p.map((r, i) => (i === idx ? { ...r, percent: e.target.value } : r))
                              )
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            style={{
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                              padding: "10px 12px",
                              borderRadius: 12,
                              cursor: "pointer",
                              fontWeight: 900,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {editTabKey === "Images" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr auto", gap: 10 }}>
                          <input
                            placeholder="Image URL"
                            value={row.url}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <input
                            placeholder="Alt text"
                            value={row.alt}
                            onChange={(e) =>
                              setEditRows((p) => p.map((r, i) => (i === idx ? { ...r, alt: e.target.value } : r)))
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            style={{
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.25)",
                              color: "white",
                              padding: "10px 12px",
                              borderRadius: 12,
                              cursor: "pointer",
                              fontWeight: 900,
                            }}
                          >
                            ✕
                          </button>

                          <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="radio"
                              name="primaryImage"
                              checked={!!row.isPrimary}
                              onChange={() =>
                                setEditRows((p) => p.map((r, i) => ({ ...r, isPrimary: i === idx })))
                              }
                            />
                            <span style={{ opacity: 0.85 }}>Primary image</span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setEditTabOpen(false)}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTab}
                disabled={editTabSaving}
                style={{
                  background: "#ff4d2d",
                  border: "none",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: editTabSaving ? "not-allowed" : "pointer",
                  fontWeight: 900,
                  opacity: editTabSaving ? 0.65 : 1,
                }}
              >
                {editTabSaving ? "Saving..." : "Save"}
              </button>
            </div>

            {editTabError && (
              <div style={{ marginTop: 10, color: "#ff6b6b", fontWeight: 700, fontSize: 13 }}>
                {editTabError}
              </div>
            )}
          </div>
        </div>
      )}
</>
);
}