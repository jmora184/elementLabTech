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
  const faqItems = [
    {
      q: "What are terpenes?",
      a: "Terpenes are naturally occurring aromatic compounds found in plants. They are widely used in flavor and fragrance applications to create distinctive sensory profiles.",
    },
    {
      q: "Are your products plant-derived?",
      a: "Yes. Our terpene blends are derived from botanicals and formulated exclusively for flavor and fragrance applications.",
    },
    {
      q: "Do your products contain any regulated or controlled substances?",
      a: "No. Our formulations consist solely of botanical aromatic compounds and contain no regulated or restricted substances.",
    },
    {
      q: "What industries do you supply?",
      a: "We supply manufacturers and product developers across vapor, infused products, edibles, beverages, and other flavor and fragrance applications.",
    },
    {
      q: "What is the difference between strain-inspired and botanical blends?",
      a: "Strain-inspired profiles are designed to replicate specific aromatic characteristics, while botanical blends focus on fruit, dessert, beverage, and conceptual flavor systems.",
    },
    {
      q: "Are your terpene systems oil-soluble or water-compatible?",
      a: "Most terpene systems are oil-soluble. Water-compatible solutions are available for beverage and emulsion-based applications.",
    },
    {
      q: "What usage percentages do you recommend?",
      a: "Inclusion levels vary by application and formulation base. Typical ranges are provided upon request to ensure optimal performance and stability.",
    },
    {
      q: "Do you offer custom formulation services?",
      a: "Yes. We develop custom aromatic systems tailored to specific performance, sensory, and application requirements.",
    },
    {
      q: "How do you ensure batch consistency?",
      a: "All formulations undergo internal quality control and standardization procedures to ensure consistency, integrity, and repeatability.",
    },
    {
      q: "Do you provide technical documentation?",
      a: "Yes. Certificates of Analysis (COA) and Safety Data Sheets (SDS) are available upon request for applicable products.",
    },
  ];

  // Lower font size for FAQ content
  const SCALE = 1.15;

  const shell = {
    maxWidth: 1050,
    margin: "0 auto",
    padding: "72px 24px 96px",
    textAlign: "left",
  };

  const headerWrap = {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    marginBottom: 42,
    textAlign: "left",
  };

  const title = {
    fontSize: 28 * SCALE,
    fontWeight: 900,
    letterSpacing: 0.2,
    margin: 0,
    color: "#fff",
    lineHeight: 1.05,
    textAlign: "left",
  };

  const subtitle = {
    margin: 0,
    fontSize: 15 * SCALE,
    lineHeight: 1.35,
    opacity: 0.95,
    maxWidth: 980,
    textAlign: "left",
  };

  const list = {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    textAlign: "left",
  };

  const item = {
    padding: "28px 26px",
    borderRadius: 18,
    background: "transparent",
    textAlign: "left",
  };

  const qRow = {
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
    textAlign: "left",
  };

  const num = {
    fontSize: 16 * SCALE,
    fontWeight: 900,
    lineHeight: 1.1,
    opacity: 0.85,
    marginTop: 2,
    flex: "0 0 auto",
    textAlign: "left",
  };

  const qText = {
    fontSize: 16 * SCALE,
    fontWeight: 900,
    lineHeight: 1.12,
    margin: 0,
    textAlign: "left",
  };

  const aText = {
    marginTop: 16,
    paddingLeft: 18 + (18 * 0),  // keep left aligned; padding is minimal
    fontSize: 15 * SCALE,
    lineHeight: 1.35,
    opacity: 0.92,
    maxWidth: 1000,
    textAlign: "left",
  };

  const footer = {
    marginTop: 42,
    fontSize: 14 * SCALE,
    lineHeight: 1.35,
    opacity: 0.9,
    maxWidth: 980,
    textAlign: "left",
  };

  return (
    <div style={elPageBackgroundStyle}>
      <div style={shell}>
        <header style={headerWrap}>
          <h1 style={title}>Frequently Asked Questions</h1>
          <p style={subtitle}>
            Don’t see your question listed? Contact us and a member of our sales team will connect with you directly.
          </p>
        </header>

        <div style={list}>
          {faqItems.map((x, idx) => (
            <section key={x.q} style={item} aria-label={`FAQ ${idx + 1}`}>
              <div style={qRow}>
                <div style={num}>{String(idx + 1).padStart(2, "0")}.</div>
                <h2 style={qText}>{x.q}</h2>
              </div>
              <div style={aText}>{x.a}</div>
            </section>
          ))}
        </div>

        <div style={footer}>
          Need COAs, SDS, or application guidance? Reach out via the Contact page and we’ll route you to the right team.
        </div>
        <div style={{ marginTop: 48, textAlign: "center" }}>
          <a href="/contact" style={{ color: "#38bdf8", fontSize: 15 * SCALE, textDecoration: "underline" }}>
            Go to Contact Page
          </a>
        </div>
      </div>
    </div>
  );
}
