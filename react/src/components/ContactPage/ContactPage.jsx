import React, { useState } from "react";
import logoImg from "../../assets/logologo.png";

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const firstName = String(form.firstName || "").trim();
    const lastName = String(form.lastName || "").trim();
    const email = String(form.email || "").trim();
    const message = String(form.message || "").trim();

    if (!firstName || !lastName || !email || !message) {
      setNotice("Please complete all fields before sending.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setNotice(data?.error || "We couldn't send your message. Please try again.");
        return;
      }

      setNotice("Thanks! Your message was sent.");
      setForm({ firstName: "", lastName: "", email: "", message: "" });
    } catch {
      setNotice("We couldn't send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contact"
      style={{
        padding: "0 24px 80px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <img src={logoImg} alt="Element Labs" style={{ width: "min(120px, 35vw)", height: "auto" }} />
      </div>

      <h1 style={{ margin: 0, fontSize: "36px", lineHeight: 1.1 }}>Contact</h1>

      <form onSubmit={onSubmit} style={{ margin: "24px auto 0", maxWidth: 760, textAlign: "left" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700 }}>
            First Name
            <input
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              required
              style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700 }}>
            Last Name
            <input
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              required
              style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15 }}
            />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700, marginTop: 12 }}>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700, marginTop: 12 }}>
          Message
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            required
            style={{ minHeight: 140, padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15, resize: "vertical" }}
          />
        </label>

        <button
          type="submit"
          disabled={sending}
          style={{
            marginTop: 14,
            background: "#fc3d21",
            color: "#fff",
            border: "1px solid #fc3d21",
            borderRadius: 10,
            padding: "12px 18px",
            fontWeight: 800,
            cursor: sending ? "not-allowed" : "pointer",
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>

        {notice ? <p style={{ marginTop: 10 }}>{notice}</p> : null}
      </form>

      <p style={{ fontSize: "18px", marginTop: "20px", fontWeight: 700 }}>
        info@elementlab.shop
      </p>
      <p style={{ fontSize: "18px", marginTop: "10px" }}>+1 (213) 293-8760</p>
      <p style={{ fontSize: "16px", marginTop: "18px" }}>
        FL Office: 515 N Flagler DrWest Palm Beach, 33401
      </p>
      <p style={{ fontSize: "16px", marginTop: "8px" }}>
        CA Office: 10250 Constellation Blvd, Los Angeles, 90067
      </p>

      <div style={{ marginTop: 40, width: "100%", display: "flex", justifyContent: "flex-end" }}>
        <p style={{ fontSize: "13px", margin: 0 }}>
          Copyright© 2026 Element Lab. All rights reserved.
        </p>
      </div>
    </section>
  );
}
