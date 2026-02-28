import React, { useState } from "react";
import logoImg from "../../assets/logologo.png";

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const firstName = String(form.firstName || "").trim();
    const lastName = String(form.lastName || "").trim();
    const company = String(form.company || "").trim();
    const phone = String(form.phone || "").trim();
    const email = String(form.email || "").trim();
    const message = String(form.message || "").trim();

    if (!firstName || !lastName || !company || !phone || !email || !message) {
      setNotice("Please complete all fields before sending.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, company, phone, email, message }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setNotice(data?.error || "We couldn't send your message. Please try again.");
        return;
      }

      setNotice("Thanks! Your message was sent.");
      setForm({ firstName: "", lastName: "", company: "", phone: "", email: "", message: "" });
    } catch {
      setNotice("We couldn't send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const elPageBackgroundStyle = {
    minHeight: "100vh",
    color: "#e8f3ec",
    background:
      "radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.20), transparent 55%), " +
      "radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,0.14), transparent 60%), " +
      "linear-gradient(180deg, #070a0d 0%, #06070a 100%)",
  };



  return (
    <div style={elPageBackgroundStyle}>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            gridTemplateRows: "auto auto",
            ...(window.innerWidth < 600 ? { gridTemplateColumns: "1fr" } : {}),
          }}
        >
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

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700 }}>
            Company Name
            <input
              value={form.company}
              onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              required
              style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700 }}>
            Phone
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              required
              style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15 }}
              pattern="[0-9\-\+\s\(\)]*"
              placeholder="e.g. (555) 123-4567"
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
    </div>
  );
}
