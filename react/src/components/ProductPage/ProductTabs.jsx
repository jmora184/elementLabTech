import React, { useMemo, useState } from "react";
import ProductReviews from "./ProductReviews";
import ProductDocuments from "./ProductDocuments";
import ProductSpecsTable from "./ProductSpecsTable";

function TabButton({ active, children, onClick, id }) {
  return (
    <button
      id={id}
      type="button"
      className={"pp-tabBtn" + (active ? " isActive" : "")}
      onClick={onClick}
      role="tab"
      aria-selected={active}
    >
      {children}
    </button>
  );
}

export default function ProductTabs({ product, selectedProfile, size, price }) {
  const [tab, setTab] = useState("details");

  const specs = useMemo(() => {
    return {
      Collection: product.name,
      "Selected profile": selectedProfile || "—",
      Size: size,
      Price: `$${Number(price).toFixed(2)}`,
      "Botanical origin": "Yes",
      "Recommended use": "Vape, pre-roll, infusion (brand-dependent)",
      Storage: "Cool, dark place. Keep sealed.",
    };
  }, [product, selectedProfile, size, price]);

  const details = useMemo(() => {
    return [
      {
        title: "About this product",
        body: product.description,
      },
      {
        title: "Profiles included",
        body:
          "Choose from the profiles below. You can feature one profile, or build a lineup across multiple SKUs.",
      },
    ];
  }, [product]);

  return (
    <div className="pp-tabs" role="tablist" aria-label="Product details tabs">
      <div className="pp-tabHeader">
        <TabButton id="tab-details" active={tab === "details"} onClick={() => setTab("details")}>
          Details
        </TabButton>
        <TabButton id="tab-specs" active={tab === "specs"} onClick={() => setTab("specs")}>
          Specs
        </TabButton>
        <TabButton id="tab-docs" active={tab === "docs"} onClick={() => setTab("docs")}>
          Documents
        </TabButton>
        <TabButton id="tab-reviews" active={tab === "reviews"} onClick={() => setTab("reviews")}>
          Reviews
        </TabButton>
        <TabButton id="tab-ship" active={tab === "shipping"} onClick={() => setTab("shipping")}>
          Shipping
        </TabButton>
      </div>

      <div className="pp-tabPanel" role="tabpanel">
        {tab === "details" && (
          <div className="pp-details">
            {details.map((s) => (
              <div key={s.title} className="pp-section">
                <h3 className="pp-h3">{s.title}</h3>
                <p className="pp-p">{s.body}</p>
              </div>
            ))}

            <div className="pp-section">
              <h3 className="pp-h3">Profile selector</h3>
              <div className="pp-chipRow">
                {product.profiles.slice(0, 18).map((p) => (
                  <span key={p} className="pp-chip" title={p}>{p}</span>
                ))}
                {product.profiles.length > 18 && (
                  <span className="pp-chip pp-chipMuted">+{product.profiles.length - 18} more</span>
                )}
              </div>
              <div className="pp-note">
                Want every profile on its own PDP? Later we can route to <code>/product/{product.id}/{`{profileSlug}`}</code>.
              </div>
            </div>
          </div>
        )}

        {tab === "specs" && (
          <div className="pp-section">
            <h3 className="pp-h3">Specifications</h3>
            <ProductSpecsTable specs={specs} />
          </div>
        )}

        {tab === "docs" && (
          <ProductDocuments productId={product.id} />
        )}

        {tab === "reviews" && (
          <div id="reviews">
            <ProductReviews productId={product.id} />
          </div>
        )}

        {tab === "shipping" && (
          <div className="pp-section">
            <h3 className="pp-h3">Shipping & Returns</h3>
            <ul className="pp-list">
              <li>Orders ship in 1–2 business days (typical).</li>
              <li>Tracking provided via email.</li>
              <li>Returns accepted on unopened items within 14 days.</li>
              <li>For bulk orders, contact us for freight options.</li>
            </ul>
            <div className="pp-note">
              Replace this copy with your real policy when you’re ready.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
