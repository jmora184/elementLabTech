import React, { useMemo, useState } from "react";
import "./TerpeneSimulator.css";

const AXES = [
  "Fruity",
  "Citrus",
  "Acidic",
  "Earthy",
  "Floral",
  "Spicy",
  "Herbal",
  "Tropical",
  "Pungent",
  "Pine",
  "Wood",
];

// NOTE: These are illustrative aroma vectors (0-100). You can swap these
// to match your internal sensory data whenever you're ready.
const TERPENES = [
  {
    key: "limonene",
    name: "Limonene",
    color: "#f59e0b",
    profile: {
      Fruity: 60,
      Citrus: 92,
      Acidic: 40,
      Earthy: 10,
      Floral: 18,
      Spicy: 12,
      Herbal: 10,
      Tropical: 35,
      Pungent: 8,
      Pine: 6,
      Wood: 10,
    },
  },
  {
    key: "myrcene",
    name: "Myrcene",
    color: "#22c55e",
    profile: {
      Fruity: 35,
      Citrus: 18,
      Acidic: 12,
      Earthy: 68,
      Floral: 20,
      Spicy: 18,
      Herbal: 75,
      Tropical: 22,
      Pungent: 30,
      Pine: 20,
      Wood: 28,
    },
  },
  {
    key: "alpha_pinene",
    name: "α-Pinene",
    color: "#06b6d4",
    profile: {
      Fruity: 10,
      Citrus: 12,
      Acidic: 8,
      Earthy: 28,
      Floral: 8,
      Spicy: 16,
      Herbal: 30,
      Tropical: 6,
      Pungent: 22,
      Pine: 95,
      Wood: 55,
    },
  },
  {
    key: "beta_pinene",
    name: "β-Pinene",
    color: "#0ea5e9",
    profile: {
      Fruity: 12,
      Citrus: 16,
      Acidic: 10,
      Earthy: 24,
      Floral: 8,
      Spicy: 14,
      Herbal: 26,
      Tropical: 8,
      Pungent: 18,
      Pine: 88,
      Wood: 48,
    },
  },
  {
    key: "linalool",
    name: "Linalool",
    color: "#a78bfa",
    profile: {
      Fruity: 22,
      Citrus: 10,
      Acidic: 6,
      Earthy: 12,
      Floral: 92,
      Spicy: 18,
      Herbal: 28,
      Tropical: 10,
      Pungent: 6,
      Pine: 6,
      Wood: 10,
    },
  },
  {
    key: "caryophyllene",
    name: "β-Caryophyllene",
    color: "#ef4444",
    profile: {
      Fruity: 8,
      Citrus: 10,
      Acidic: 6,
      Earthy: 55,
      Floral: 10,
      Spicy: 92,
      Herbal: 42,
      Tropical: 8,
      Pungent: 60,
      Pine: 12,
      Wood: 40,
    },
  },
  {
    key: "humulene",
    name: "Humulene",
    color: "#84cc16",
    profile: {
      Fruity: 8,
      Citrus: 8,
      Acidic: 6,
      Earthy: 58,
      Floral: 8,
      Spicy: 45,
      Herbal: 70,
      Tropical: 6,
      Pungent: 30,
      Pine: 20,
      Wood: 35,
    },
  },
  {
    key: "terpinolene",
    name: "Terpinolene",
    color: "#38bdf8",
    profile: {
      Fruity: 55,
      Citrus: 45,
      Acidic: 18,
      Earthy: 20,
      Floral: 28,
      Spicy: 12,
      Herbal: 22,
      Tropical: 52,
      Pungent: 10,
      Pine: 35,
      Wood: 18,
    },
  },
  {
    key: "ocimene",
    name: "Ocimene",
    color: "#fb7185",
    profile: {
      Fruity: 70,
      Citrus: 40,
      Acidic: 22,
      Earthy: 8,
      Floral: 38,
      Spicy: 10,
      Herbal: 20,
      Tropical: 78,
      Pungent: 8,
      Pine: 10,
      Wood: 8,
    },
  },
  {
    key: "geraniol",
    name: "Geraniol",
    color: "#f472b6",
    profile: {
      Fruity: 35,
      Citrus: 18,
      Acidic: 10,
      Earthy: 8,
      Floral: 88,
      Spicy: 8,
      Herbal: 18,
      Tropical: 20,
      Pungent: 6,
      Pine: 6,
      Wood: 8,
    },
  },
  {
    key: "bisabolol",
    name: "Bisabolol",
    color: "#fda4af",
    profile: {
      Fruity: 18,
      Citrus: 8,
      Acidic: 6,
      Earthy: 10,
      Floral: 60,
      Spicy: 10,
      Herbal: 18,
      Tropical: 12,
      Pungent: 6,
      Pine: 6,
      Wood: 10,
    },
  },
  {
    key: "farnesene",
    name: "Farnesene",
    color: "#f97316",
    profile: {
      Fruity: 55,
      Citrus: 18,
      Acidic: 10,
      Earthy: 12,
      Floral: 18,
      Spicy: 10,
      Herbal: 18,
      Tropical: 35,
      Pungent: 8,
      Pine: 6,
      Wood: 10,
    },
  },
  {
    key: "nerolidol",
    name: "Nerolidol",
    color: "#10b981",
    profile: {
      Fruity: 12,
      Citrus: 6,
      Acidic: 4,
      Earthy: 35,
      Floral: 22,
      Spicy: 10,
      Herbal: 20,
      Tropical: 8,
      Pungent: 8,
      Pine: 6,
      Wood: 40,
    },
  },
  {
    key: "terpineol",
    name: "Terpineol",
    color: "#8b5cf6",
    profile: {
      Fruity: 18,
      Citrus: 12,
      Acidic: 6,
      Earthy: 10,
      Floral: 55,
      Spicy: 10,
      Herbal: 20,
      Tropical: 10,
      Pungent: 6,
      Pine: 18,
      Wood: 10,
    },
  },
  {
    key: "borneol",
    name: "Borneol",
    color: "#14b8a6",
    profile: {
      Fruity: 6,
      Citrus: 6,
      Acidic: 4,
      Earthy: 22,
      Floral: 8,
      Spicy: 18,
      Herbal: 50,
      Tropical: 4,
      Pungent: 25,
      Pine: 35,
      Wood: 25,
    },
  },
  {
    key: "camphene",
    name: "Camphene",
    color: "#22c55e",
    profile: {
      Fruity: 6,
      Citrus: 8,
      Acidic: 4,
      Earthy: 18,
      Floral: 6,
      Spicy: 12,
      Herbal: 28,
      Tropical: 4,
      Pungent: 20,
      Pine: 70,
      Wood: 45,
    },
  },
  {
    key: "phellandrene",
    name: "β-Phellandrene",
    color: "#3b82f6",
    profile: {
      Fruity: 22,
      Citrus: 30,
      Acidic: 10,
      Earthy: 10,
      Floral: 10,
      Spicy: 10,
      Herbal: 18,
      Tropical: 18,
      Pungent: 12,
      Pine: 45,
      Wood: 15,
    },
  },
];

// Strain-inspired presets (illustrative). Real terpene profiles vary by batch/grower.
// These presets are intended as starting points for aroma exploration only.
const STRAIN_PRESETS = [
  {
    key: "og_kush",
    name: "OG Kush",
    description: "Earthy / pine / citrus (strain‑inspired)",
    defaults: {
      myrcene: 28,
      caryophyllene: 20,
      limonene: 16,
      alpha_pinene: 10,
      humulene: 8,
      linalool: 6,
      terpinolene: 4,
      beta_pinene: 4,
      borneol: 4,
    },
  },
  {
    key: "blue_dream",
    name: "Blue Dream",
    description: "Fruity / floral / sweet (strain‑inspired)",
    defaults: {
      myrcene: 22,
      limonene: 18,
      pinene: 0, // legacy compatibility (unused)
      alpha_pinene: 12,
      beta_pinene: 8,
      terpinolene: 10,
      ocimene: 10,
      linalool: 8,
      geraniol: 6,
      farnesene: 6,
    },
  },
  {
    key: "gelato",
    name: "Gelato",
    description: "Sweet / citrus / creamy (strain‑inspired)",
    defaults: {
      caryophyllene: 22,
      limonene: 18,
      myrcene: 16,
      linalool: 10,
      humulene: 8,
      ocimene: 8,
      terpineol: 6,
      geraniol: 6,
      farnesene: 6,
    },
  },
  {
    key: "sour_diesel",
    name: "Sour Diesel",
    description: "Citrus / pungent / fuel (strain‑inspired)",
    defaults: {
      limonene: 26,
      caryophyllene: 18,
      myrcene: 14,
      alpha_pinene: 10,
      beta_pinene: 8,
      humulene: 8,
      terpinolene: 8,
      borneol: 4,
      camphene: 4,
    },
  },
  {
    key: "granddaddy_purple",
    name: "Granddaddy Purple",
    description: "Grape / floral / earthy (strain‑inspired)",
    defaults: {
      myrcene: 26,
      linalool: 14,
      caryophyllene: 14,
      limonene: 10,
      humulene: 8,
      geraniol: 8,
      terpineol: 8,
      nerolidol: 6,
      bisabolol: 6,
    },
  },
];

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function makeZeroWeights() {
  const out = {};
  for (const t of TERPENES) out[t.key] = 0;
  return out;
}

function computeBlendFromWeights(weights) {
  const total = Object.values(weights || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
  const denom = total <= 0 ? 1 : total;

  const out = {};
  for (const axis of AXES) out[axis] = 0;

  for (const t of TERPENES) {
    const amount = Number(weights?.[t.key]) || 0;
    if (amount <= 0) continue;
    const w = amount / denom;
    for (const axis of AXES) {
      out[axis] += (t.profile?.[axis] || 0) * w;
    }
  }

  // Normalize to 0..1 for chart math.
  const out01 = {};
  for (const axis of AXES) out01[axis] = clamp01((out[axis] || 0) / 100);
  return { out01, total };
}


function safeNumber(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, v);
}

function normalizeWeightsTo100(weights) {
  const total = Object.values(weights || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
  if (total <= 0) return weights;
  const factor = 100 / total;
  const out = {};
  for (const k of Object.keys(weights)) out[k] = Math.round((Number(weights[k]) || 0) * factor * 10) / 10;
  return out;
}

export default function TerpeneSimulator() {
  const [presetKey, setPresetKey] = useState("");
  const [search, setSearch] = useState("");
  const [weights, setWeights] = useState(() => makeZeroWeights());

  const { out01: blend, total: totalParts } = useMemo(() => computeBlendFromWeights(weights), [weights]);

  const nonZero = useMemo(() => {
    return TERPENES
      .map((t) => ({ ...t, amount: Number(weights?.[t.key]) || 0 }))
      .filter((t) => t.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [weights]);

  const topNotes = useMemo(() => {
    const sorted = [...AXES].sort((a, b) => (blend[b] || 0) - (blend[a] || 0));
    return sorted.slice(0, 3).map((axis) => ({ axis, v: blend[axis] || 0 }));
  }, [blend]);

  const filteredTerpenes = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return TERPENES;
    return TERPENES.filter((t) => t.name.toLowerCase().includes(q) || t.key.toLowerCase().includes(q));
  }, [search]);

  const applyPreset = (nextKey) => {
    setPresetKey(nextKey);
    if (!nextKey) return;
    const preset = STRAIN_PRESETS.find((p) => p.key === nextKey);
    if (!preset) return;

    const next = makeZeroWeights();
    for (const [k, v] of Object.entries(preset.defaults || {})) {
      if (Object.prototype.hasOwnProperty.call(next, k)) next[k] = safeNumber(v);
    }
    setWeights(next);
  };

  const setAmount = (key, amount) => {
    const next = safeNumber(amount);
    setWeights((prev) => ({ ...prev, [key]: next }));
  };

  const onResetAll = () => {
    setPresetKey("");
    setSearch("");
    setWeights(makeZeroWeights());
  };

  const onNormalize = () => {
    setWeights((prev) => normalizeWeightsTo100(prev));
  };

  return (
    <section className="sim-section" aria-label="Terpene Blend Simulator">
      <div className="sim-inner">
        <div className="sim-header">
          <div className="sim-badge">Interactive</div>
          <h2 className="sim-title">Terpene Blend Simulator</h2>
          <p className="sim-subtitle">
            Choose a strain-inspired starting profile, then tweak any terpene on the master list.
          </p>
        </div>

        <div className="sim-grid">
          <div className="sim-panel sim-panel-left">
            <div className="sim-panelTop">
              <h3 className="sim-panelTitle">Start with a preset (optional)</h3>
              <div className="sim-actions">
                <button type="button" className="sim-btn sim-btn-ghost" onClick={onNormalize} disabled={totalParts <= 0}>
                  Normalize
                </button>
                <button type="button" className="sim-btn" onClick={onResetAll}>
                  Reset
                </button>
              </div>
            </div>

            <div className="sim-addRow">
              <select
                className="sim-select"
                value={presetKey}
                onChange={(e) => applyPreset(e.target.value)}
                aria-label="Choose strain preset"
              >
                <option value="">Custom / No preset</option>
                {STRAIN_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="sim-presetNote" aria-label="Preset description">
                {presetKey
                  ? STRAIN_PRESETS.find((p) => p.key === presetKey)?.description
                  : "Pick a starting profile, or build your own from zero."}
              </div>
            </div>

            <div className="sim-searchRow">
              <input
                className="sim-select"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search terpenes (e.g., limonene, pinene)..."
                aria-label="Search terpenes"
              />
            </div>

            <div className="sim-list">
              {filteredTerpenes.map((t) => {
                const color = t.color || "#111";
                const amount = Number(weights?.[t.key]) || 0;
                const pct = totalParts > 0 ? Math.round((amount / totalParts) * 100) : 0;

                return (
                  <div key={t.key} className="sim-row" style={{ borderColor: color }}>
                    <div className="sim-rowHead">
                      <div className="sim-rowTitle">
                        <span className="sim-swatch" style={{ background: color }} aria-hidden="true" />
                        <span>{t.name}</span>
                      </div>
                      <div className="sim-rowMeta">
                        <span className="sim-chip" style={{ background: color }}>
                          {pct}%
                        </span>
                      </div>
                    </div>

                    <div className="sim-sliderRow">
                      <input
                        className="sim-slider"
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={amount}
                        onChange={(e) => setAmount(t.key, e.target.value)}
                        style={{ accentColor: color }}
                        aria-label={`${t.name} amount`}
                      />

                      <input
                        className="sim-weightInput"
                        type="number"
                        min={0}
                        step={0.5}
                        value={amount}
                        onChange={(e) => setAmount(t.key, e.target.value)}
                        aria-label={`${t.name} numeric amount`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sim-foot">
              <div className="sim-footLeft">
                <div className="sim-miniTitle">Total parts</div>
                <div className="sim-total">{Math.round(totalParts * 10) / 10}</div>
              </div>
              <div className="sim-footRight">
                <div className="sim-miniTitle">Top notes</div>
                <div className="sim-tip">
                  {topNotes.map((n) => (
                    <span key={n.axis} className="sim-noteChip">
                      {n.axis}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="sim-disclaimer">
              Presets are <strong>strain-inspired starting points</strong>. Real terpene profiles vary by grower, batch, and lab results.
            </div>
          </div>

          <div className="sim-panel sim-panel-right">
            <h3 className="sim-panelTitle">Aroma fingerprint</h3>
            <div className="sim-chartWrap">
              <RadarSVG axes={AXES} values={blend} />
            </div>
            <div className="sim-legend">
              {nonZero.slice(0, 6).map((t) => (
                <div key={t.key} className="sim-legendItem">
                  <span className="sim-swatch" style={{ background: t.color }} aria-hidden="true" />
                  <span className="sim-legendText">{t.name}</span>
                </div>
              ))}
              {nonZero.length === 0 && <div className="sim-legendMore">Add parts below to see contributors.</div>}
              {nonZero.length > 6 && <div className="sim-legendMore">+{nonZero.length - 6} more</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RadarSVG({ axes, values }) {
  const size = 520;
  const padding = 70;
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - padding;
  const rings = 5;
  const angleStep = (Math.PI * 2) / axes.length;

  const points = axes.map((axis, i) => {
    const v = clamp01(values?.[axis] ?? 0);
    const a = -Math.PI / 2 + i * angleStep;
    const x = cx + Math.cos(a) * r * v;
    const y = cy + Math.sin(a) * r * v;
    return { x, y, v, axis, a };
  });

  const polygon = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  const labelPoints = axes.map((axis, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const x = cx + Math.cos(a) * (r + 36);
    const y = cy + Math.sin(a) * (r + 36);
    return { axis, x, y, a };
  });

  // Colorful axis labels (repeat palette as needed)
  const labelPalette = ["#22c55e", "#f59e0b", "#38bdf8", "#a78bfa", "#fb7185", "#ef4444", "#84cc16"];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Aroma fingerprint radar chart"
    >
      <defs>
        <radialGradient id="simFill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(34, 197, 94, 0.35)" />
          <stop offset="60%" stopColor="rgba(56, 189, 248, 0.22)" />
          <stop offset="100%" stopColor="rgba(167, 139, 250, 0.20)" />
        </radialGradient>
        <filter id="simGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rings */}
      {Array.from({ length: rings }).map((_, idx) => {
        const rr = (r * (idx + 1)) / rings;
        return (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={rr}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axes */}
      {axes.map((axis, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return (
          <line
            key={axis}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(0,0,0,0.10)"
            strokeWidth="1"
          />
        );
      })}

      {/* Blend polygon */}
      <polygon points={polygon} fill="url(#simFill)" stroke="rgba(17,17,17,0.35)" strokeWidth="2" filter="url(#simGlow)" />

      {/* Points */}
      {points.map((p) => (
        <circle key={p.axis} cx={p.x} cy={p.y} r={4.2} fill="rgba(17,17,17,0.55)" />
      ))}

      {/* Labels */}
      {labelPoints.map((lp, i) => {
        const fill = labelPalette[i % labelPalette.length];
        const anchor = Math.abs(Math.cos(lp.a)) < 0.2 ? "middle" : Math.cos(lp.a) > 0 ? "start" : "end";
        const dy = Math.abs(Math.sin(lp.a)) < 0.2 ? 5 : lp.y > cy ? 12 : -6;
        return (
          <text
            key={lp.axis}
            x={lp.x}
            y={lp.y + dy}
            textAnchor={anchor}
            fontSize="12"
            fontWeight="900"
            fill={fill}
          >
            {lp.axis}
          </text>
        );
      })}
    </svg>
  );
}
