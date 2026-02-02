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
const ISOLATES = [
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
    key: "pinene",
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
];

const DEFAULT_BLEND = [
  { key: "limonene", weight: 40 },
  { key: "myrcene", weight: 30 },
  { key: "pinene", weight: 20 },
  { key: "linalool", weight: 10 },
];

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function computeBlend(selected) {
  const total = selected.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);
  const denom = total <= 0 ? 1 : total;

  const out = {};
  for (const axis of AXES) out[axis] = 0;

  for (const s of selected) {
    const iso = ISOLATES.find((x) => x.key === s.key);
    if (!iso) continue;
    const w = (Number(s.weight) || 0) / denom;
    for (const axis of AXES) {
      out[axis] += (iso.profile[axis] || 0) * w;
    }
  }

  // Normalize to 0..1 for chart math.
  const out01 = {};
  for (const axis of AXES) out01[axis] = clamp01((out[axis] || 0) / 100);
  return out01;
}

function getIsolate(key) {
  return ISOLATES.find((x) => x.key === key);
}

export default function TerpeneSimulator() {
  const [selected, setSelected] = useState(DEFAULT_BLEND);
  const [pendingKey, setPendingKey] = useState(
    ISOLATES.find((i) => !DEFAULT_BLEND.some((s) => s.key === i.key))?.key || ISOLATES[0].key
  );

  const blend = useMemo(() => computeBlend(selected), [selected]);

  const usedKeys = new Set(selected.map((s) => s.key));
  const available = ISOLATES.filter((i) => !usedKeys.has(i.key));

  const totalWeight = selected.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);

  const onAdd = () => {
    if (!pendingKey || usedKeys.has(pendingKey)) return;
    setSelected((prev) => [...prev, { key: pendingKey, weight: 20 }]);
    const next = available.find((i) => i.key !== pendingKey) || ISOLATES[0];
    setPendingKey(next?.key || ISOLATES[0].key);
  };

  const onRemove = (key) => {
    setSelected((prev) => prev.filter((s) => s.key !== key));
  };

  const onWeight = (key, weight) => {
    setSelected((prev) => prev.map((s) => (s.key === key ? { ...s, weight } : s)));
  };

  const onReset = () => setSelected(DEFAULT_BLEND);

  const onRandom = () => {
    // A simple colorful shuffle: pick 3-6 isolates and random weights.
    const count = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...ISOLATES].sort(() => Math.random() - 0.5).slice(0, count);
    const weights = shuffled.map(() => 10 + Math.floor(Math.random() * 45));
    setSelected(
      shuffled.map((i, idx) => ({
        key: i.key,
        weight: weights[idx],
      }))
    );
  };

  return (
    <section className="sim-section" aria-label="Terpene Blend Simulator">
      <div className="sim-inner">
        <div className="sim-header">
          <div className="sim-badge">Interactive</div>
          <h2 className="sim-title">Terpene Blend Simulator</h2>
          <p className="sim-subtitle">
            Mix isolates, adjust ratios, and watch the aroma fingerprint update in real time.
          </p>
        </div>

        <div className="sim-grid">
          <div className="sim-panel sim-panel-left">
            <div className="sim-panelTop">
              <h3 className="sim-panelTitle">Build your blend</h3>
              <div className="sim-actions">
                <button type="button" className="sim-btn sim-btn-ghost" onClick={onRandom}>
                  Randomize
                </button>
                <button type="button" className="sim-btn" onClick={onReset}>
                  Reset
                </button>
              </div>
            </div>

            <div className="sim-addRow">
              <select
                className="sim-select"
                value={pendingKey}
                onChange={(e) => setPendingKey(e.target.value)}
                disabled={available.length === 0}
                aria-label="Add isolate"
              >
                {(available.length ? available : ISOLATES).map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="sim-btn sim-btn-add"
                onClick={onAdd}
                disabled={available.length === 0 || usedKeys.has(pendingKey)}
              >
                Add
              </button>
            </div>

            <div className="sim-list">
              {selected.map((s) => {
                const iso = getIsolate(s.key);
                const color = iso?.color || "#111";
                const pct = totalWeight > 0 ? Math.round(((Number(s.weight) || 0) / totalWeight) * 100) : 0;
                return (
                  <div key={s.key} className="sim-row" style={{ borderColor: color }}>
                    <div className="sim-rowHead">
                      <div className="sim-rowTitle">
                        <span className="sim-swatch" style={{ background: color }} aria-hidden="true" />
                        <span>{iso?.name || s.key}</span>
                      </div>
                      <div className="sim-rowMeta">
                        <span className="sim-chip" style={{ background: color }}>
                          {pct}%
                        </span>
                        <button
                          type="button"
                          className="sim-iconBtn"
                          onClick={() => onRemove(s.key)}
                          aria-label={`Remove ${iso?.name || s.key}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="sim-sliderRow">
                      <input
                        className="sim-slider"
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Number(s.weight) || 0}
                        onChange={(e) => onWeight(s.key, Number(e.target.value))}
                        style={{ accentColor: color }}
                        aria-label={`${iso?.name || s.key} weight`}
                      />
                      <div className="sim-weight" style={{ color }}>
                        {Number(s.weight) || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sim-foot">
              <div className="sim-footLeft">
                <div className="sim-miniTitle">Total parts</div>
                <div className="sim-total">{totalWeight}</div>
              </div>
              <div className="sim-footRight">
                <div className="sim-miniTitle">Tip</div>
                <div className="sim-tip">Try 60/30/10 for a crisp top note + smooth base.</div>
              </div>
            </div>
          </div>

          <div className="sim-panel sim-panel-right">
            <h3 className="sim-panelTitle">Aroma fingerprint</h3>
            <div className="sim-chartWrap">
              <RadarSVG axes={AXES} values={blend} />
            </div>
            <div className="sim-legend">
              {selected.slice(0, 6).map((s) => {
                const iso = getIsolate(s.key);
                const color = iso?.color || "#111";
                return (
                  <div key={s.key} className="sim-legendItem">
                    <span className="sim-swatch" style={{ background: color }} aria-hidden="true" />
                    <span className="sim-legendText">{iso?.name || s.key}</span>
                  </div>
                );
              })}
              {selected.length > 6 && <div className="sim-legendMore">+{selected.length - 6} more</div>}
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
  const labelPalette = [
    "#22c55e",
    "#f59e0b",
    "#38bdf8",
    "#a78bfa",
    "#fb7185",
    "#ef4444",
    "#84cc16",
    "#06b6d4",
    "#e879f9",
    "#f97316",
    "#10b981",
  ];

  return (
    <svg
      className="sim-radar"
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Radar chart of the blended aroma profile"
    >
      <defs>
        <linearGradient id="simGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.95" />
          <stop offset="0.33" stopColor="#38bdf8" stopOpacity="0.95" />
          <stop offset="0.66" stopColor="#a78bfa" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fb7185" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="simFill" cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fb7185" stopOpacity="0.18" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={r + 22} fill="url(#simFill)" opacity="0.25" />

      {/* Grid rings */}
      {Array.from({ length: rings }).map((_, idx) => {
        const rr = (r * (idx + 1)) / rings;
        const ringPoints = axes
          .map((_, i) => {
            const a = -Math.PI / 2 + i * angleStep;
            const x = cx + Math.cos(a) * rr;
            const y = cy + Math.sin(a) * rr;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
          })
          .join(" ");
        return (
          <polygon
            key={idx}
            points={ringPoints}
            fill="none"
            stroke="#e5e7eb"
            strokeOpacity={0.9}
            strokeWidth={1}
          />
        );
      })}

      {/* Axes lines */}
      {labelPoints.map((p, i) => (
        <line
          key={p.axis}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(p.a) * r}
          y2={cy + Math.sin(p.a) * r}
          stroke="#e5e7eb"
          strokeOpacity={0.9}
          strokeWidth={1}
        />
      ))}

      {/* Blend polygon */}
      <polygon
        points={polygon}
        fill="url(#simFill)"
        stroke="url(#simGlow)"
        strokeWidth={3}
        filter="url(#softShadow)"
      />

      {/* Vertex dots */}
      {points.map((p, i) => (
        <circle
          key={p.axis}
          cx={p.x}
          cy={p.y}
          r={5.5}
          fill={labelPalette[i % labelPalette.length]}
          opacity={0.95}
        />
      ))}

      {/* Labels */}
      {labelPoints.map((p, i) => {
        const textAnchor = Math.abs(Math.cos(p.a)) < 0.15 ? "middle" : Math.cos(p.a) > 0 ? "start" : "end";
        const dy = Math.sin(p.a) > 0.35 ? 16 : Math.sin(p.a) < -0.35 ? -6 : 6;
        return (
          <text
            key={p.axis}
            x={p.x}
            y={p.y + dy}
            textAnchor={textAnchor}
            className="sim-axisLabel"
            fill={labelPalette[i % labelPalette.length]}
          >
            {p.axis}
          </text>
        );
      })}
    </svg>
  );
}
