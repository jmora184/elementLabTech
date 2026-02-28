import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./HeroMotion.module.css";
import backgroundImg from "../../assets/background.png";
import chemPicImg from "../../assets/chemPic.avif";
import chemPic3Img from "../../assets/chempic3.jpg";
import chemPic5Img from "../../assets/chempic5.jpg";

/**
 * HeroMotion
 * - Animated gradient "aurora" background
 * - Optional parallax image layer
 * - Optional auto-rotating slides (text + background image)
 * - Respects prefers-reduced-motion
 *
 * Usage (Next.js / React):
 *   import HeroMotion from "./components/HeroMotion/HeroMotion";
 *   <HeroMotion />
 */
export default function HeroMotion() {
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Replace these with your own content / images
  const slides = useMemo(
    () => [
      {
        eyebrow: "",
        title: "Premium Flavor Ingredients",
        body: "Create Your Ideal Aroma & Taste",
        ctas: [
          { text: "Customize", href: "/customize" },
          { text: "Isolates", href: "/isolates" },
          { text: "Terpenes", href: "#terpenes" },
        ],
        bgImage:
          "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=2000&q=60",
      },
      {
        eyebrow: "",
        title: "Shop By Flavor",
        body: "Engineered for consistency, crafted for compliance",
        ctas: [
          { text: "Shop Now", href: "/product/matrix-collection" },
          { text: "Request Samples", href: "/samples" },
          { text: "Authentic", href: "/product/emerald-cut" },
        ],
        bgImage: backgroundImg,
      },
      {
        eyebrow: "",
        title: "Trending Flavors Done Right",
        body: "Discover market favorites before they hit the scene",
        ctas: [
          { text: "Candy", href: "/product/matrix-collection?profile=green-jelly-rancher" },
          { text: "Drinks", href: "/product/matrix-collection?profile=cola" },
          { text: "Wild Card", href: "/product/matrix-collection?profile=tres-leches" },
        ],
        bgImage: chemPicImg,
      },
      {
        eyebrow: "",
        title: "Custom Blends Made Simple",
        body: "Tailor your flavors exactly how you envision them.",
        ctas: [
          { text: "Adjust Intensity", href: "/customize" },
          { text: "Formulator Tools", href: "#terpene-simulator" },
        ],
        bgImage: chemPic3Img,
      },
      {
        eyebrow: "",
        title: "Regulation-Ready, Globally Approved",
        body: "Market-Ready: Everywhere. Focus on creating, not compliance.",
        ctas: [
          { text: "COAs", href: "/qna" },
          { text: "SDS's", href: "/qna" },
          { text: "Request List of Ingrediants", href: "/qna" },
        ],
        bgImage: chemPic5Img,
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(Boolean(mq.matches));
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Auto-rotate slides (disabled if reduced motion)
  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setInterval(() => setActive((v) => (v + 1) % slides.length), 5200);
    return () => window.clearInterval(t);
  }, [reduceMotion, slides.length]);

  // Parallax background position (disabled if reduced motion)
  useEffect(() => {
    if (reduceMotion) return;
    const el = heroRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const progress = 1 - Math.min(1, Math.max(0, rect.top / viewportH)); // 0..1
      // Moves background subtly 40px over the scroll range
      el.style.setProperty("--parallaxY", `${Math.round(progress * 40)}px`);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduceMotion]);

  const s = slides[active];

  return (
    <section className={styles.wrap} aria-label="Hero">
      <div
        ref={heroRef}
        className={styles.hero}
        style={{ ["--bg" as any]: `url(${s.bgImage})` }}
      >
        <div className={styles.aurora} aria-hidden="true" />
        <div className={styles.imageLayer} aria-hidden="true" />
        <div className={styles.content}>
          {s.eyebrow ? <div className={styles.badge}>{s.eyebrow}</div> : null}
          <h1 className={styles.title}>{s.title}</h1>
          <p className={styles.body}>{s.body}</p>
          <div className={styles.actions}>
            {s.ctas.map((cta, i) => (
              <a
                key={`${cta.text}-${i}`}
                className={i === 0 ? styles.primaryBtn : styles.ghostBtn}
                href={cta.href}
              >
                {cta.text}
              </a>
            ))}
          </div>

          <div className={styles.dots} role="tablist" aria-label="Hero slides">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
                onClick={() => setActive(i)}
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to slide ${i + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
