import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}

function bytesToLabel(bytes) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

function normalizePosts(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((p, idx) => {
      const images = Array.isArray(p.images)
        ? p.images
        : Array.isArray(p.imageUrls)
          ? p.imageUrls.map((url) => ({ url }))
          : p.imageUrl || p.image_url
            ? [{ url: p.imageUrl || p.image_url }]
            : [];

      const attachments = Array.isArray(p.attachments)
        ? p.attachments
        : Array.isArray(p.documents)
          ? p.documents
          : p.attachmentUrl || p.attachment_url
            ? [{ url: p.attachmentUrl || p.attachment_url, name: p.attachmentName || "Download" }]
            : [];

      return {
        id: p.id ?? p.postId ?? `${idx}`,
        title: p.title ?? "Untitled",
        message: p.message ?? p.body ?? "",
        createdAt: p.createdAt ?? p.created_at ?? p.date ?? "",
        author: p.author ?? "",
        images: images
          .filter(Boolean)
          .map((img, i) =>
            typeof img === "string"
              ? { url: img, alt: `${p.title || "Image"} ${i + 1}` }
              : { url: img.url, alt: img.alt || `${p.title || "Image"} ${i + 1}` }
          )
          .filter((img) => !!img.url),
        attachments: attachments
          .filter(Boolean)
          .map((a, i) =>
            typeof a === "string"
              ? { url: a, name: `Document ${i + 1}` }
              : {
                  url: a.url,
                  name: a.name || `Document ${i + 1}`,
                  sizeLabel: a.sizeLabel,
                  sizeBytes: a.sizeBytes,
                }
          )
          .filter((a) => !!a.url),
      };
    })
    .sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad;
    });
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

function PostCard({ post, onOpen }) {
  const cover = post.images?.[0]?.url;

  return (
    <article
      onClick={() => onOpen(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" ? onOpen(post) : null)}
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(10, 14, 18, 0.72)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        cursor: "pointer",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        outline: "none",
      }}
      className="el-blog-card"
    >
      {cover ? (
        <div style={{ position: "relative" }}>
          <img
            src={cover}
            alt={post.images?.[0]?.alt || post.title}
            style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }}
            loading="lazy"
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.8))",
            }}
          />
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {post.createdAt ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}
                >
                  {formatDate(post.createdAt)}
                </span>
              ) : null}
              {post.attachments?.length ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(34,197,94,0.35)",
                    color: "rgba(232,255,241,0.9)",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.2,
                  }}
                >
                  {post.attachments.length} file{post.attachments.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            <h3
              style={{
                margin: "10px 0 0 0",
                color: "#fff",
                fontSize: 18,
                fontWeight: 950,
                lineHeight: 1.15,
                letterSpacing: -0.2,
                textShadow: "0 12px 32px rgba(0,0,0,0.55)",
              }}
            >
              {post.title}
            </h3>
          </div>
        </div>
      ) : null}

      <div style={{ padding: 16 }}>
        {!cover ? (
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 950, lineHeight: 1.15 }}>
              {post.title}
            </h3>
            {post.createdAt ? (
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700 }}>
                {formatDate(post.createdAt)}
              </span>
            ) : null}
          </div>
        ) : null}

        <p
          style={{
            margin: "10px 0 0 0",
            color: "rgba(255,255,255,0.78)",
            fontSize: 14,
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.message}
        </p>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "rgba(34,197,94,0.9)",
                boxShadow: "0 0 0 4px rgba(34,197,94,0.18)",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700 }}>
              Read post
            </span>
          </div>

          {post.images?.length ? (
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700 }}>
              {post.images.length} image{post.images.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Modal({ open, onClose, children, ariaLabel }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => (e.key === "Escape" ? onClose() : null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => (e.target === e.currentTarget ? onClose() : null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "min(980px, 100%)",
          maxHeight: "min(86vh, 900px)",
          overflow: "auto",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(10, 14, 18, 0.92)",
          boxShadow: "0 24px 90px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null;

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <h4 style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: 0.2 }}>
          Downloads
        </h4>
        <span style={{ color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: 700 }}>
          {attachments.length} item{attachments.length === 1 ? "" : "s"}
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {attachments.map((a, i) => (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            download
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
            }}
            className="el-download"
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {a.name || `Document ${i + 1}`}
              </div>
              {(a.sizeLabel || a.sizeBytes) ? (
                <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: 700 }}>
                  {a.sizeLabel || bytesToLabel(a.sizeBytes)}
                </div>
              ) : null}
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 999,
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.10)",
                color: "rgba(232,255,241,0.95)",
                fontSize: 12,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              Download
              <span aria-hidden="true" style={{ transform: "translateY(-1px)" }}>↘</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ImageGrid({ images }) {
  if (!images?.length) return null;

  const count = images.length;
  const gridTemplate = count === 1 ? "1fr" : count === 2 ? "1fr 1fr" : "1fr 1fr";

  return (
    <div style={{ marginTop: 18 }}>
      <h4 style={{ margin: "0 0 10px 0", color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: 0.2 }}>
        Images
      </h4>

      <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 10 }}>
        {images.slice(0, 6).map((img, i) => (
          <a
            key={`${img.url}-${i}`}
            href={img.url}
            target="_blank"
            rel="noreferrer"
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
              display: "block",
              textDecoration: "none",
            }}
            className="el-image"
            aria-label={`Open image ${i + 1}`}
          >
            <img
              src={img.url}
              alt={img.alt || `Image ${i + 1}`}
              style={{
                width: "100%",
                height: count === 1 ? 340 : 180,
                objectFit: "cover",
                display: "block",
              }}
              loading="lazy"
            />
          </a>
        ))}
      </div>

      {images.length > 6 ? (
        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: 700 }}>
          Showing 6 of {images.length} images.
        </div>
      ) : null}
    </div>
  );
}

function PostDetail({ post, onClose, isAdmin, onEdit, onDelete, deletingId }) {
  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {post.createdAt ? (
              <span style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: 800 }}>
                {formatDate(post.createdAt)}
              </span>
            ) : null}
            {post.author ? (
              <span style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: 800 }}>
                • {post.author}
              </span>
            ) : null}
          </div>
          <h2 style={{ margin: "10px 0 0 0", color: "#fff", fontSize: 26, fontWeight: 1000, letterSpacing: -0.4, lineHeight: 1.12 }}>
            {post.title}
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {isAdmin ? (
            <>
              <button
                onClick={() => onEdit(post)}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontWeight: 900,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
                className="el-btn"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(post)}
                disabled={deletingId === post.id}
                style={{
                  border: "1px solid rgba(248,113,113,0.30)",
                  background: "rgba(248,113,113,0.12)",
                  color: "#fff",
                  fontWeight: 900,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: deletingId === post.id ? "not-allowed" : "pointer",
                  opacity: deletingId === post.id ? 0.7 : 1,
                }}
                className="el-btn"
              >
                {deletingId === post.id ? "Deleting..." : "Delete"}
              </button>
            </>
          ) : null}

          <button
            onClick={onClose}
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontWeight: 900,
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
            }}
            aria-label="Close"
            className="el-btn"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="el-modal-grid" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              padding: 16,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 900, letterSpacing: 0.2 }}>
              Message
            </div>
            <div style={{ height: 10 }} />
            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
              {post.message}
            </div>
          </div>

          <ImageGrid images={post.images} />
        </div>

        <aside style={{ position: "sticky", top: 16, alignSelf: "start" }}>
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(34,197,94,0.9)",
                  boxShadow: "0 0 0 4px rgba(34,197,94,0.18)",
                }}
              />
              <div style={{ color: "#fff", fontWeight: 950, letterSpacing: 0.2 }}>
                Attachments
              </div>
            </div>

            <AttachmentList attachments={post.attachments} />

            {!post.attachments?.length ? (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: 700 }}>
                No downloads for this post.
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div style={{ height: 10 }} />
    </div>
  );
}

export default function BlogPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [posts, setPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filteredCountLabel = useMemo(() => {
    const n = posts.length;
    if (!n) return "No posts";
    if (n === 1) return "1 post";
    return `${n} posts`;
  }, [posts.length]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await fetchJson("/api/blog", { method: "GET" });
        if (mounted) setPosts(normalizePosts(data));
      } catch (err) {
        if (mounted) setLoadError(err.message || "Error loading posts");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setImage(null);
    setAttachment(null);
    setFormError("");
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(post) {
    setEditingId(post.id);
    setTitle(post.title || "");
    setMessage(post.message || "");
    setImage(null);
    setAttachment(null);
    setFormError("");
    setShowForm(true);
    setActivePost(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const payload = { title, message };
      const method = editingId ? "PATCH" : "POST";
      const endpoint = editingId ? `/api/blog/${encodeURIComponent(editingId)}` : "/api/blog";
      const data = await fetchJson(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const updatedPost = normalizePosts([data?.post])[0];
      if (updatedPost) {
        setPosts((prev) => {
          const withoutCurrent = prev.filter((p) => p.id !== updatedPost.id);
          return normalizePosts([updatedPost, ...withoutCurrent]);
        });
        setActivePost(updatedPost);
      }

      closeForm();
    } catch (err) {
      setFormError(err.message || "Error publishing post");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(post) {
    if (!post?.id) return;
    const ok = window.confirm(`Delete blog post "${post.title}"?`);
    if (!ok) return;

    setDeletingId(post.id);
    setFormError("");

    try {
      await fetchJson(`/api/blog/${encodeURIComponent(post.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      if (activePost?.id === post.id) setActivePost(null);
      if (editingId === post.id) closeForm();
    } catch (err) {
      setFormError(err.message || "Error deleting post");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <style>{`
        .el-blog-card:hover { transform: translateY(-2px); box-shadow: 0 18px 60px rgba(0,0,0,0.45); border-color: rgba(34,197,94,0.35); }
        .el-btn:hover { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.10); }
        .el-download:hover { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.10); }
        .el-image:hover { border-color: rgba(34,197,94,0.35); }
        @media (max-width: 860px) {
          .el-modal-grid { grid-template-columns: 1fr !important; }
          .el-post-grid-item { grid-column: span 12 !important; }
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.20), transparent 55%), radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,0.14), transparent 60%), linear-gradient(180deg, #070a0d 0%, #06070a 100%)",
          padding: "34px 16px 70px",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
              boxShadow: "0 24px 90px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <h1
                    style={{
                      margin: "12px 0 0 0",
                      fontSize: 36,
                      fontWeight: 1000,
                      letterSpacing: -0.8,
                      color: "#fff",
                      lineHeight: 1.05,
                    }}
                  >
                    R&D Journal
                  </h1>
                  <p style={{ margin: "12px 0 0 0", maxWidth: 740, color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.6 }}>
                    Product updates, R&amp;D notes, release announcements, and behind-the-scenes stories — including
                    images and downloadable documents.
                  </p>

                  <div style={{ marginTop: 14, color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: 800 }}>
                    {filteredCountLabel}
                    {loadError ? <span style={{ marginLeft: 10, color: "rgba(248,113,113,0.95)" }}>• {loadError}</span> : null}
                    {!authLoading && !isAdmin ? <span style={{ marginLeft: 10 }}>• Read-only for non-admin users</span> : null}
                  </div>
                </div>

                {isAdmin ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => (showForm ? closeForm() : openCreateForm())}
                      style={{
                        background: showForm ? "rgba(255,255,255,0.06)" : "rgba(34,197,94,0.95)",
                        color: "#fff",
                        fontWeight: 950,
                        border: showForm ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(34,197,94,0.40)",
                        borderRadius: 14,
                        padding: "12px 14px",
                        cursor: "pointer",
                        boxShadow: showForm ? "none" : "0 14px 40px rgba(34,197,94,0.20)",
                      }}
                      className="el-btn"
                    >
                      {showForm ? "Close editor" : "Add post"}
                    </button>
                  </div>
                ) : null}
              </div>

              {isAdmin && showForm ? (
                <div>
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      marginTop: 18,
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(10, 14, 18, 0.68)",
                      padding: 16,
                      color: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 1000 }}>
                        {editingId ? "Edit post" : "Add post"}
                      </div>
                      {editingId ? (
                        <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: 800 }}>
                          Editing post #{editingId}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontWeight: 900, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.86)", fontSize: 12, letterSpacing: 0.2 }}>
                          Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          placeholder="e.g., New terpene sample kit release"
                          style={{
                            width: "100%",
                            padding: "12px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontWeight: 900, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.86)", fontSize: 12, letterSpacing: 0.2 }}>
                          Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                          rows={5}
                          placeholder="Write your post…"
                          style={{
                            width: "100%",
                            padding: "12px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                            outline: "none",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontWeight: 900, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.86)", fontSize: 12, letterSpacing: 0.2 }}>
                          Image (optional, not saved yet)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImage(e.target.files?.[0] || null)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.03)",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        />
                        {image ? (
                          <div style={{ marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 800 }}>
                            Selected: {image.name}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label style={{ fontWeight: 900, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.86)", fontSize: 12, letterSpacing: 0.2 }}>
                          Document (optional, not saved yet)
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.03)",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        />
                        {attachment ? (
                          <div style={{ marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 800 }}>
                            Selected: {attachment.name}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {formError ? (
                      <div style={{ marginTop: 12, color: "rgba(248,113,113,0.95)", fontWeight: 900 }}>
                        {formError}
                      </div>
                    ) : null}

                    <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={closeForm}
                        style={{
                          background: "transparent",
                          color: "rgba(255,255,255,0.85)",
                          fontWeight: 900,
                          border: "1px solid rgba(255,255,255,0.14)",
                          borderRadius: 14,
                          padding: "12px 14px",
                          cursor: "pointer",
                        }}
                        className="el-btn"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          background: "rgba(34,197,94,0.95)",
                          color: "#fff",
                          fontWeight: 950,
                          border: "1px solid rgba(34,197,94,0.40)",
                          borderRadius: 14,
                          padding: "12px 14px",
                          cursor: submitting ? "not-allowed" : "pointer",
                          opacity: submitting ? 0.7 : 1,
                        }}
                        className="el-btn"
                      >
                        {submitting ? (editingId ? "Saving..." : "Publishing...") : (editingId ? "Save changes" : "Publish")}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              <div style={{ height: 1, marginTop: 18, background: "rgba(255,255,255,0.08)" }} />

              <div style={{ padding: "22px 0 0 0" }}>
                {loading ? (
                  <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 900 }}>
                    Loading posts…
                  </div>
                ) : posts.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 14 }}>
                    {posts.map((p) => (
                      <div key={p.id} className="el-post-grid-item" style={{ gridColumn: "span 6" }}>
                        <PostCard post={p} onOpen={setActivePost} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 18,
                      border: "1px dashed rgba(255,255,255,0.16)",
                      background: "rgba(255,255,255,0.03)",
                      padding: 18,
                      color: "rgba(255,255,255,0.72)",
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ fontWeight: 950, color: "#fff", marginBottom: 6 }}>
                      No posts yet.
                    </div>
                    When you publish your first post, it will appear here with images and downloadable documents.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal open={!!activePost} onClose={() => setActivePost(null)} ariaLabel={activePost?.title || "Blog post"}>
          {activePost ? (
            <PostDetail
              post={activePost}
              onClose={() => setActivePost(null)}
              isAdmin={isAdmin}
              onEdit={openEditForm}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
