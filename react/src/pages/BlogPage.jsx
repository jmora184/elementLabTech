import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { uploadImageFile } from "../utils/cloudflareImages";

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtmlToText(value) {
  const html = String(value || "");
  if (!html.trim()) return "";

  if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
    const doc = new window.DOMParser().parseFromString(html, "text/html");
    return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeHtml(value) {
  const raw = String(value || "");
  if (!raw.trim()) return "";

  if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "");
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(raw, "text/html");
  ["script", "style", "iframe", "object", "embed", "link", "meta"].forEach((tag) => {
    doc.querySelectorAll(tag).forEach((node) => node.remove());
  });

  doc.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = String(attr.name || "").toLowerCase();
      const value = String(attr.value || "");
      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
        return;
      }
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) {
        node.removeAttribute(attr.name);
        return;
      }
      if (name === "style") node.removeAttribute(attr.name);
    });

    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noreferrer noopener");
    }

    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
      if (!node.getAttribute("alt")) node.setAttribute("alt", "Blog image");
    }
  });

  return doc.body?.innerHTML || "";
}

function messageToDisplayHtml(value) {
  const raw = String(value || "");
  if (!raw.trim()) return "";

  if (/<\/?[a-z][\s\S]*>/i.test(raw)) {
    return sanitizeHtml(raw);
  }

  return escapeHtml(raw).replace(/\n/g, "<br />");
}

function excerptFromMessage(value) {
  return stripHtmlToText(value);
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

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null;

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
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
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 13,
                  letterSpacing: 0.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {a.name || `Document ${i + 1}`}
              </div>
              {a.sizeLabel || a.sizeBytes ? (
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
              <span aria-hidden="true" style={{ transform: "translateY(-1px)" }}>
                ↘
              </span>
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
  const gridTemplate = count === 1 ? "1fr" : "1fr 1fr";

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

function PostCard({ post, expanded, onToggle, isAdmin, onEdit, onDelete, deletingId }) {
  const cover = post.images?.[0]?.url;

  return (
    <article
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: expanded ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.08)",
        background: "rgba(10, 14, 18, 0.72)",
        boxShadow: expanded ? "0 18px 60px rgba(0,0,0,0.45)" : "0 14px 40px rgba(0,0,0,0.35)",
        transition: "box-shadow 140ms ease, border-color 140ms ease",
      }}
      className="el-blog-card"
    >
      <button
        type="button"
        onClick={() => onToggle(post.id)}
        style={{
          display: "block",
          width: "100%",
          padding: 0,
          textAlign: "left",
          border: 0,
          background: "transparent",
          cursor: "pointer",
          color: "inherit",
        }}
        aria-expanded={expanded}
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
              WebkitLineClamp: expanded ? 20 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {excerptFromMessage(post.message)}
          </p>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
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
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700 }}>
                {expanded ? "Hide post" : "Read post"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {post.images?.length ? (
                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700 }}>
                  {post.images.length} image{post.images.length === 1 ? "" : "s"}
                </span>
              ) : null}
              <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: 900 }}>
                {expanded ? "− Collapse" : "+ Expand"}
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded ? (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: 16,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
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
              <h2
                style={{
                  margin: "10px 0 0 0",
                  color: "#fff",
                  fontSize: 26,
                  fontWeight: 1000,
                  letterSpacing: -0.4,
                  lineHeight: 1.12,
                }}
              >
                {post.title}
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {isAdmin ? (
                <>
                  <button
                    type="button"
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
                    type="button"
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
                type="button"
                onClick={() => onToggle(post.id)}
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
                Collapse
              </button>
            </div>
          </div>

          <div className="el-expanded-grid" style={{ marginTop: 16, display: "grid", gap: 16 }}>
            <div style={{ width: "100%", maxWidth: 1080 }}>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  padding: 16,
                  marginBottom: 16,
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
                <div
                  className="el-blog-message"
                  style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, lineHeight: 1.75 }}
                  dangerouslySetInnerHTML={{ __html: messageToDisplayHtml(post.message) }}
                />
              </div>

              <ImageGrid images={post.images} />
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function BlogPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inlineImageUploading, setInlineImageUploading] = useState(false);
  const [editorDragActive, setEditorDragActive] = useState(false);
  const [formError, setFormError] = useState("");

  const editorRef = useRef(null);
  const imagePickerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);
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

  useEffect(() => {
    if (!showForm || !editorRef.current) return;
    editorRef.current.innerHTML = message || "";
  }, [showForm, editingId]);

  function syncMessageFromEditor() {
    if (!editorRef.current) return;
    setMessage(editorRef.current.innerHTML || "");
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function runEditorCommand(command, value = null) {
    focusEditor();
    document.execCommand(command, false, value);
    syncMessageFromEditor();
  }

  function insertHtmlAtCursor(html) {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    syncMessageFromEditor();
  }

  function placeCaretFromPoint(clientX, clientY) {
    const sel = window.getSelection?.();
    if (!sel) return;

    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(clientX, clientY);
      if (pos) {
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return;
    }

    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(clientX, clientY);
      if (range) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  function insertMarkerAtSelection(markerId) {
    const markerHtml = `<span data-blog-marker="${markerId}" contenteditable="false">&#8203;</span>`;
    insertHtmlAtCursor(markerHtml);
  }

  function replaceMarkerWithHtml(markerId, html) {
    if (!editorRef.current) return;
    const marker = editorRef.current.querySelector(`[data-blog-marker="${markerId}"]`);
    if (marker) {
      marker.outerHTML = html;
    } else {
      editorRef.current.insertAdjacentHTML("beforeend", html);
    }
    syncMessageFromEditor();
  }

  async function uploadInlineImages(files, point = null) {
    const imageFiles = Array.from(files || []).filter((file) => file && /^image\//i.test(file.type || ""));
    if (!imageFiles.length) return;

    if (!editorRef.current) {
      setFormError("Open the editor before adding images.");
      return;
    }

    setFormError("");
    setInlineImageUploading(true);

    try {
      focusEditor();
      if (point) placeCaretFromPoint(point.x, point.y);

      const markerId = `blog-marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      insertMarkerAtSelection(markerId);

      const uploadedHtml = [];
      for (const file of imageFiles) {
        const out = await uploadImageFile(file, {
          metadata: {
            purpose: "blog-inline",
            blog_post_id: editingId || "new",
            file_name: file.name,
          },
        });
        if (out?.url) {
          const safeAlt = escapeHtml(file.name.replace(/\.[^.]+$/, "") || "Blog image");
          uploadedHtml.push(
            `<figure><img src="${out.url}" alt="${safeAlt}" /></figure><p><br></p>`
          );
        }
      }

      if (uploadedHtml.length) replaceMarkerWithHtml(markerId, uploadedHtml.join(""));
    } catch (err) {
      setFormError(err?.message || "Could not upload image.");
    } finally {
      setInlineImageUploading(false);
      setEditorDragActive(false);
    }
  }

  function handleEditorPaste(e) {
    const files = Array.from(e.clipboardData?.files || []).filter((file) => /^image\//i.test(file.type || ""));
    if (!files.length) return;
    e.preventDefault();
    uploadInlineImages(files);
  }

  function handleEditorDrop(e) {
    e.preventDefault();
    setEditorDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []).filter((file) => /^image\//i.test(file.type || ""));
    if (!files.length) return;
    uploadInlineImages(files, { x: e.clientX, y: e.clientY });
  }

  function handleEditorDragOver(e) {
    e.preventDefault();
    if (!editorDragActive) setEditorDragActive(true);
  }

  function handleEditorDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setEditorDragActive(false);
  }

  function handlePickInlineImage(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadInlineImages(files);
    e.target.value = "";
  }

  function handleInsertLink() {
    const url = window.prompt("Paste the link URL");
    if (!url) return;
    runEditorCommand("createLink", url.trim());
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setInlineImageUploading(false);
    setEditorDragActive(false);
    setFormError("");
    if (editorRef.current) editorRef.current.innerHTML = "";
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(post) {
    setEditingId(post.id);
    setTitle(post.title || "");
    setMessage(post.message || "");
    setInlineImageUploading(false);
    setEditorDragActive(false);
    setFormError("");
    setShowForm(true);
    setExpandedPostId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function toggleExpanded(postId) {
    setExpandedPostId((prev) => (prev === postId ? null : postId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const cleanMessage = (editorRef.current?.innerHTML || message || "").trim();
      if (!title.trim()) throw new Error("Title is required.");
      if (!stripHtmlToText(cleanMessage)) throw new Error("Message is required.");

      const payload = { title: title.trim(), message: cleanMessage };
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
        setExpandedPostId(updatedPost.id);
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
      if (expandedPostId === post.id) setExpandedPostId(null);
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
        .el-blog-card:hover { box-shadow: 0 18px 60px rgba(0,0,0,0.45); }
        .el-btn:hover { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.10); }
        .el-download:hover { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.10); }
        .el-image:hover { border-color: rgba(34,197,94,0.35); }
        .el-blog-message img, .el-blog-editor img { max-width: 100%; height: auto; border-radius: 16px; display: block; }
        .el-blog-message figure, .el-blog-editor figure { margin: 16px 0; }
        .el-blog-message p, .el-blog-editor p { margin: 0 0 14px 0; }
        .el-blog-message blockquote, .el-blog-editor blockquote { margin: 16px 0; padding-left: 14px; border-left: 3px solid rgba(34,197,94,0.45); color: rgba(255,255,255,0.82); }
        .el-blog-message a, .el-blog-editor a { color: #86efac; }
        .el-blog-editor:empty:before { content: attr(data-placeholder); color: rgba(255,255,255,0.34); }
        @media (max-width: 860px) {
          .el-expanded-grid { grid-template-columns: 1fr !important; }
          .el-post-list { max-width: 100% !important; }
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

                    <div style={{ display: "grid", gap: 12 }}>
                      <div>
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

                      <div>
                        <label style={{ fontWeight: 900, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.86)", fontSize: 12, letterSpacing: 0.2 }}>
                          Message
                        </label>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                          {[
                            ["Bold", () => runEditorCommand("bold")],
                            ["Italic", () => runEditorCommand("italic")],
                            ["H3", () => runEditorCommand("formatBlock", "<h3>")],
                            ["Quote", () => runEditorCommand("formatBlock", "<blockquote>")],
                            ["Bullets", () => runEditorCommand("insertUnorderedList")],
                          ].map(([label, action]) => (
                            <button
                              key={label}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={action}
                              style={{
                                border: "1px solid rgba(255,255,255,0.14)",
                                background: "rgba(255,255,255,0.05)",
                                color: "#fff",
                                fontWeight: 900,
                                borderRadius: 12,
                                padding: "8px 10px",
                                cursor: "pointer",
                              }}
                              className="el-btn"
                            >
                              {label}
                            </button>
                          ))}

                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleInsertLink}
                            style={{
                              border: "1px solid rgba(255,255,255,0.14)",
                              background: "rgba(255,255,255,0.05)",
                              color: "#fff",
                              fontWeight: 900,
                              borderRadius: 12,
                              padding: "8px 10px",
                              cursor: "pointer",
                            }}
                            className="el-btn"
                          >
                            Link
                          </button>

                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => imagePickerRef.current?.click()}
                            style={{
                              border: "1px solid rgba(34,197,94,0.30)",
                              background: "rgba(34,197,94,0.12)",
                              color: "#fff",
                              fontWeight: 900,
                              borderRadius: 12,
                              padding: "8px 10px",
                              cursor: inlineImageUploading ? "not-allowed" : "pointer",
                              opacity: inlineImageUploading ? 0.7 : 1,
                            }}
                            className="el-btn"
                            disabled={inlineImageUploading}
                          >
                            {inlineImageUploading ? "Uploading image…" : "Add image"}
                          </button>

                          <input
                            ref={imagePickerRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePickInlineImage}
                            style={{ display: "none" }}
                          />
                        </div>

                        <div
                          style={{
                            borderRadius: 16,
                            border: editorDragActive
                              ? "1px solid rgba(34,197,94,0.55)"
                              : "1px solid rgba(255,255,255,0.14)",
                            background: editorDragActive ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: 800 }}>
                            Drag and drop images into the editor, paste screenshots, or use Add image.
                          </div>
                          <div
                            ref={editorRef}
                            className="el-blog-editor"
                            contentEditable
                            suppressContentEditableWarning
                            data-placeholder="Write your post…"
                            onInput={syncMessageFromEditor}
                            onBlur={syncMessageFromEditor}
                            onPaste={handleEditorPaste}
                            onDrop={handleEditorDrop}
                            onDragOver={handleEditorDragOver}
                            onDragLeave={handleEditorDragLeave}
                            style={{
                              minHeight: 260,
                              padding: "14px 14px 18px",
                              color: "#fff",
                              outline: "none",
                              lineHeight: 1.7,
                              fontSize: 14,
                              textAlign: "left",
                              direction: "ltr",
                            }}
                          />
                        </div>
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
                        {submitting ? (editingId ? "Saving..." : "Publishing...") : editingId ? "Save changes" : "Publish"}
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
                  <div className="el-post-list" style={{ display: "grid", gap: 14, maxWidth: 1080 }}>
                    {posts.map((p) => (
                      <PostCard
                        key={p.id}
                        post={p}
                        expanded={expandedPostId === p.id}
                        onToggle={toggleExpanded}
                        isAdmin={isAdmin}
                        onEdit={openEditForm}
                        onDelete={handleDelete}
                        deletingId={deletingId}
                      />
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
      </div>
    </div>
  );
}
