// src/utils/cloudflareImages.js
// Small helper for Cloudflare Images direct uploads via our backend.

export async function createDirectUpload(metadata = undefined) {
  const res = await fetch("/api/images/direct-upload", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata ? { metadata } : {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Failed to create upload URL (${res.status})`);
  }
  return { id: data.id, uploadURL: data.uploadURL };
}

export async function uploadToDirectUploadURL(uploadURL, file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(uploadURL, { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    const msg = data?.errors?.[0]?.message || `Upload failed (${res.status})`;
    throw new Error(msg);
  }
  const result = data.result || {};
  return {
    imageId: result.id,
    variants: Array.isArray(result.variants) ? result.variants : [],
  };
}

export async function uploadImageFile(file, { metadata } = {}) {
  const { uploadURL } = await createDirectUpload(metadata);
  const out = await uploadToDirectUploadURL(uploadURL, file);
  // Use the first variant URL as the stored/display URL.
  const url = out.variants[0] || "";
  return { ...out, url };
}
