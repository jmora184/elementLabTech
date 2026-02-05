import React, { useEffect, useState } from "react";

/**
 * AdminEditProfileModal
 * - Drop-in modal to edit a flavor profile's details.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   initialProfile: object | null   (expects fields like name, flavor_type, etc)
 *   onSave: (payload) => Promise<void>  (payload matches the PUT endpoint body)
 */
export default function AdminEditProfileModal({ open, onClose, initialProfile, onSave }) {
  const [form, setForm] = useState({
    name: "",
    flavor_type: "",
    flavor_category: "",
    description: "",
    mood: "",
    dominant_terpenes_csv: "",
    flavor_aroma_csv: "",
    sort_order: "",
    is_active: true,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialProfile) return;
    setForm({
      name: initialProfile.name || "",
      flavor_type: initialProfile.flavor_type || "",
      flavor_category: initialProfile.flavor_category || "",
      description: initialProfile.description || "",
      mood: initialProfile.mood || "",
      dominant_terpenes_csv: (Array.isArray(initialProfile.dominant_terpenes) ? initialProfile.dominant_terpenes : []).join(", "),
      flavor_aroma_csv: (Array.isArray(initialProfile.flavor_aroma) ? initialProfile.flavor_aroma : []).join(", "),
      sort_order: initialProfile.sort_order === null || initialProfile.sort_order === undefined ? "" : String(initialProfile.sort_order),
      is_active: initialProfile.is_active === undefined ? true : Boolean(initialProfile.is_active),
    });
    setErr("");
  }, [initialProfile, open]);

  if (!open) return null;

  async function handleSave() {
    setErr("");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        flavor_type: form.flavor_type.trim(),
        flavor_category: form.flavor_category.trim(),
        description: form.description.trim(),
        mood: form.mood.trim(),
        dominant_terpenes: form.dominant_terpenes_csv.split(",").map((s) => s.trim()).filter(Boolean),
        flavor_aroma: form.flavor_aroma_csv.split(",").map((s) => s.trim()).filter(Boolean),
        sort_order: form.sort_order === "" ? null : Number(form.sort_order),
        is_active: Boolean(form.is_active),
      };
      await onSave(payload);
      onClose();
    } catch (e) {
      setErr(e?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit flavor profile"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "white" }}>Edit Flavor Profile</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {err && (
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
            {err}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            Sort order
            <input
              inputMode="numeric"
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            Flavor type
            <input
              value={form.flavor_type}
              onChange={(e) => setForm((p) => ({ ...p, flavor_type: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            Flavor category
            <input
              value={form.flavor_category}
              onChange={(e) => setForm((p) => ({ ...p, flavor_category: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, gridColumn: "1 / -1" }}>
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
                resize: "vertical",
              }}
            />
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            Mood
            <input
              value={form.mood}
              onChange={(e) => setForm((p) => ({ ...p, mood: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            Active
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, gridColumn: "1 / -1" }}>
            Dominant terpenes (comma-separated)
            <input
              value={form.dominant_terpenes_csv}
              onChange={(e) => setForm((p) => ({ ...p, dominant_terpenes_csv: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, gridColumn: "1 / -1" }}>
            Flavor & aroma (comma-separated)
            <input
              value={form.flavor_aroma_csv}
              onChange={(e) => setForm((p) => ({ ...p, flavor_aroma_csv: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
