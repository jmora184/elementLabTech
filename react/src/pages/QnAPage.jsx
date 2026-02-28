import React from "react";

export default function QnAPage() {
  return (
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
  );
}
