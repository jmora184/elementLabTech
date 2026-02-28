import React from "react";

const elPageBackgroundStyle = {
  minHeight: "100vh",
  color: "#e8f3ec",
  background:
    "radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.20), transparent 55%), " +
    "radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,0.14), transparent 60%), " +
    "linear-gradient(180deg, #070a0d 0%, #06070a 100%)",
};


export default function QnAPage() {
  return (
    <div style={elPageBackgroundStyle}>
      <br></br>
      <section style={{ maxWidth: 700, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 32, marginBottom: 18 }}>Requesting Ingredient Lists, SDS, or COA Documentation</h1>
      <p style={{ fontSize: 18, marginBottom: 18 }}>
        If you require an Ingredient Statement, Safety Data Sheet (SDS), or Certificate of Analysis (COA), please submit a request using the contact information below. To ensure a prompt response, include your company name, product SKU, batch or lot number (if applicable), and the specific document(s) needed.
      </p>
      <p style={{ fontSize: 18, marginBottom: 18 }}>
        Our compliance team will review your request and respond within standard business hours. Documentation is provided to verified customers and partners to support regulatory, quality assurance, and formulation requirements.
      </p>
      <div style={{ marginTop: 32, fontSize: 17 }}>
        <strong>Contact:</strong>
        <br />
        info@elementlab.shop
        <br />
        +1 (213) 293-8760
      </div>
    </section>
    </div>
  );
}
