import React from "react";
import "./ApplicationsPage.css";

import vaporImg from "../../assets/vapor.png";
import infusedFlowerImg from "../../assets/infusedflower.png";
import prerollImg from "../../assets/preoll.png";
import beverageImg from "../../assets/beverage.png";
import gummiesImg from "../../assets/gummies.png";

export default function ApplicationsPage() {
  const items = [
    {
      image: vaporImg,
      alt: "Vapor Phase",
      section: "Vapor Phase",
      headline: "Molecular Diffusion",
      body:
        "Precision-engineered terpene blends optimized for vaporization, delivering clean flavor expression, smooth inhale, and consistent aromatic performance across hardware systems.",
    },
    {
      image: infusedFlowerImg,
      alt: "Botanical Infusion",
      section: "Botanical Infusion",
      headline: "Uniform Dispersion",
      body:
        "Uniform terpene dispersion systems formulated to achieve boosted aromatic intensity, improved sensory depth, and optimal integration in infused flower products.",
    },
    {
      image: prerollImg,
      alt: "Pre-Rolls",
      section: "Pre-Rolls",
      headline: "Combustion Engineering",
      body:
        "High-impact terpene applications built for strain amplification and volatile preservation, elevating aroma and preserving performance from grind to combustion.",
    },
    {
      image: beverageImg,
      alt: "Beverages",
      section: "Beverages",
      headline: "Nanoemulsion",
      body:
        "Water-soluble terpene solutions formulated for long-term stability, consistent flavor dispersion across RTD and concentrate beverage applications.",
    },
    {
      image: gummiesImg,
      alt: "Edibles",
      section: "Edibles",
      headline: "Hydrocolloid Matrix Technology",
      body:
        "Flavor-forward terpene blends crafted for sugar systems, delivering bright top notes, lasting flavor retention, and excellent compatibility in pectin or gelatin bases.",
    },
  ];

  return (
    <section id="applications" className="ap-section">
      <div className="ap-inner">
        <div className="ap-header">
          <h1 className="ap-title">Applications</h1>
          <p className="ap-subtitle">
            Explore application-focused terpene solutions across vapor, infused flower, beverages, edibles, and more.
          </p>
        </div>

        <div className="ap-grid">
          {items.map((it) => (
            <article key={it.section} className="ap-card">
              <div className="ap-imageWrap" aria-hidden="true">
                <img className="ap-image" src={it.image} alt={it.alt} loading="lazy" />
              </div>

              <div className="ap-content">
                <div className="ap-kicker">{it.section}</div>
                <h3 className="ap-headline">{it.headline}</h3>
                <p className="ap-body">{it.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
