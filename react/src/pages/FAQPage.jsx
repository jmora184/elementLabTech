import React from "react";

const elPageBackgroundStyle = {
  minHeight: "100vh",
  color: "#e8f3ec",
  background:
    "radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.20), transparent 55%), " +
    "radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,0.14), transparent 60%), " +
    "linear-gradient(180deg, #070a0d 0%, #06070a 100%)",
};

export default function FAQPage() {
  return (
    <div style={elPageBackgroundStyle}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 18, color: "#b7f8b7" }}>Frequently Asked Questions</h1>
        <div style={{ color: "#e8f3ec", fontSize: 15, opacity: 0.95, marginBottom: 18 }}>
          Don’t see your question listed? Contact us and a member of our sales team will connect with you directly.
        </div>
        <div style={{ color: "#e8f3ec", fontSize: 15, opacity: 0.92, lineHeight: 1.7 }}>
          <ol style={{ paddingLeft: 18 }}>
            <li><b>What are terpenes?</b><br />
              Terpenes are naturally occurring aromatic compounds found in plants. They are widely used in flavor and fragrance applications to create distinctive sensory profiles.
            </li>
            <li><b>Are your products plant-derived?</b><br />
              Yes. Our terpene blends are derived from botanicals and formulated exclusively for flavor and fragrance applications.
            </li>
            <li><b>Do your products contain any regulated or controlled substances?</b><br />
              No. Our formulations consist solely of botanical aromatic compounds and contain no regulated or restricted substances.
            </li>
            <li><b>What industries do you supply?</b><br />
              We supply manufacturers and product developers across vapor, infused products, edibles, beverages, and other flavor and fragrance applications.
            </li>
            <li><b>What is the difference between strain-inspired and botanical blends?</b><br />
              Strain-inspired profiles are designed to replicate specific aromatic characteristics, while botanical blends focus on fruit, dessert, beverage, and conceptual flavor systems.
            </li>
            <li><b>Are your terpene systems oil-soluble or water-compatible?</b><br />
              Most terpene systems are oil-soluble. Water-compatible solutions are available for beverage and emulsion-based applications.
            </li>
            <li><b>What usage percentages do you recommend?</b><br />
              Inclusion levels vary by application and formulation base. Typical ranges are provided upon request to ensure optimal performance and stability.
            </li>
            <li><b>Do you offer custom formulation services?</b><br />
              Yes. We develop custom aromatic systems tailored to specific performance, sensory, and application requirements.
            </li>
            <li><b>How do you ensure batch consistency?</b><br />
              All formulations undergo internal quality control and standardization procedures to ensure consistency, integrity, and repeatability.
            </li>
            <li><b>Do you provide technical documentation?</b><br />
              Yes. Certificates of Analysis (COA) and Safety Data Sheets (SDS) are available upon request for applicable products.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
