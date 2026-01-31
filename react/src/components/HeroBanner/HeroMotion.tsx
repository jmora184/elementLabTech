import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./HeroMotion.module.css";

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
        eyebrow: "Element Lab",
        title: "Terpenes, done right.",
        body: "Flavor profiles built for consistency, scalability, and clean performance.",
        ctaText: "Shop Terpenes",
        ctaHref: "#shop",
        bgImage:
          "https://images.unsplash.com/photo-1544816565-c199d984d8b0?auto=format&fit=crop&w=2000&q=60",
      },
      {
        eyebrow: "Blend Library",
        title: "Strain-style profiles",
        body: "Dial in aroma and taste with repeatable terpene blends.",
        ctaText: "Explore Profiles",
        ctaHref: "#profiles",
        bgImage:
          "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=2000&q=60",
      },
      {
        eyebrow: "Quality First",
        title: "Built for production",
        body: "Designed for brands that need predictable output at scale.",
        ctaText: "Learn More",
        ctaHref: "#quality",
        bgImage:
          "https://images.unsplash.com/photo-1520975682031-a8d0c9bcbf57?auto=format&fit=crop&w=2000&q=60",
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
          <div className={styles.badge}>{s.eyebrow}</div>
          <h1 className={styles.title}>{s.title}</h1>
          <p className={styles.body}>{s.body}</p>
          <div className={styles.actions}>
            <a className={styles.primaryBtn} href={s.ctaHref}>
              {s.ctaText}
            </a>
            <button
              className={styles.ghostBtn}
              type="button"
              onClick={() => setActive((v) => (v + 1) % slides.length)}
              aria-label="Next hero message"
            >
              Next
            </button>
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
