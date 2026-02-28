import React, { useMemo, useState } from "react";

const APPLICATION_OPTIONS = [
  { key: "vape", label: "Vape" },
  { key: "pre_rolls", label: "Pre-Rolls" },
  { key: "infused_flower", label: "Infused Flower" },
  { key: "gummies_edibles", label: "Gummies / Edibles" },
  { key: "beverages", label: "Beverages" },
  { key: "other", label: "Other" },
];

const PROFILE_OPTIONS = [
  { key: "strain_inspired", label: "Strain-inspired" },
  { key: "botanical", label: "Botanical" },
  { key: "candy_dessert", label: "Candy / Dessert" },
  { key: "beverage_forward", label: "Beverage-forward" },
  { key: "custom_concept", label: "Custom concept" },
  { key: "reformulation", label: "Reformulation of an existing SKU" },
];

const TERPENE_OPTIONS = [
  { key: "hdt", label: "HDT" },
  { key: "bdt", label: "BDT" },
  { key: "hybrid", label: "Hybrid" },
  { key: "not_sure", label: "Not sure — need guidance" },
];

const SENSORY_OPTIONS = [
  { key: "gas_fuel", label: "Gas / Fuel" },
  { key: "citrus", label: "Citrus" },
  { key: "tropical", label: "Tropical" },
  { key: "sweet", label: "Sweet" },
  { key: "creamy", label: "Creamy" },
  { key: "herbal_pine", label: "Herbal / Pine" },
  { key: "savory", label: "Savory" },
  { key: "other", label: "Other" },
];

const COMPLIANCE_OPTIONS = [
  { key: "state_specific", label: "State-specific restrictions" },
  { key: "allergen_free", label: "Allergen-free" },
  { key: "vegan", label: "Vegan" },
  { key: "solvent_free", label: "Solvent-free" },
  { key: "docs_required", label: "Documentation required (COA / SDS / Ingredient List)" },
];

const VOLUME_OPTIONS = [
  { key: "rd_sample", label: "R&D Sample" },
  { key: "pilot_scale", label: "Pilot Scale" },
  { key: "full_production", label: "Full Production" },
];

const TIMELINE_OPTIONS = [
  { key: "immediate", label: "Immediate (2–3 weeks)" },
  { key: "30_days", label: "30 days" },
  { key: "60_plus", label: "60+ days" },
];

const REF_OPTIONS = [
  { key: "existing_formula", label: "Existing formula" },
  { key: "competitor_sample", label: "Competitor sample" },
  { key: "inspiration_notes", label: "Inspiration notes" },
];

function toggleInArray(arr, key) {
  if (!Array.isArray(arr)) return [key];
  return arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];
}

function formatLabelFromKey(options, key) {
  return options.find((o) => o.key === key)?.label || key;
}

export default function CustomizePage() {
  React.useEffect(() => {
    document.body.style.background = '#fff';
    document.body.style.color = '#000';
    return () => {
      document.body.style.background = '';
      document.body.style.color = '';
    };
  }, []);
  const [flavorName, setFlavorName] = useState("");

  const [applications, setApplications] = useState([]);
  const [applicationOther, setApplicationOther] = useState("");

  const [profileType, setProfileType] = useState("");
  const [terpeneType, setTerpeneType] = useState("");

  const [sensory, setSensory] = useState([]);
  const [sensoryOther, setSensoryOther] = useState("");

  const [compliance, setCompliance] = useState([]);

  const [inclusionRate, setInclusionRate] = useState("");
  const [annualVolume, setAnnualVolume] = useState("");
  const [timeline, setTimeline] = useState("");

  const [referenceMaterials, setReferenceMaterials] = useState([]);
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stateMarket, setStateMarket] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState(false);

  const compiledMessage = useMemo(() => {
    const list = (title, items) => {
      if (!items || items.length === 0) return `${title}: (not selected)`;
      return `${title}: ${items.join(", ")}`;
    };

    const appLabels = applications.map((k) => formatLabelFromKey(APPLICATION_OPTIONS, k));
    const sensoryLabels = sensory.map((k) => formatLabelFromKey(SENSORY_OPTIONS, k));
    const complianceLabels = compliance.map((k) => formatLabelFromKey(COMPLIANCE_OPTIONS, k));
    const refLabels = referenceMaterials.map((k) => formatLabelFromKey(REF_OPTIONS, k));

    const appOtherLine =
      applications.includes("other") && applicationOther.trim()
        ? `Application — Other: ${applicationOther.trim()}`
        : "";

    const sensoryOtherLine =
      sensory.includes("other") && sensoryOther.trim()
        ? `Target sensory — Other: ${sensoryOther.trim()}`
        : "";

    const attachLine = attachments.length
      ? `Attachments selected: ${attachments.map((f) => f.name).join(", ")}`
      : "Attachments selected: (none)";

    return [
      `CUSTOM FORMULATION INTAKE`,
      `Flavor Name: ${flavorName || "(blank)"}`,
      "",
      list("1) Application", appLabels),
      appOtherLine,
      `2) Profile type: ${profileType ? formatLabelFromKey(PROFILE_OPTIONS, profileType) : "(not selected)"}`,
      `3) HDT/BDT/Hybrid: ${terpeneType ? formatLabelFromKey(TERPENE_OPTIONS, terpeneType) : "(not selected)"}`,
      list("4) Target sensory direction", sensoryLabels),
      sensoryOtherLine,
      list("5) Compliance requirements", complianceLabels),
      `6) Target inclusion rate (%): ${String(inclusionRate || "").trim() || "(blank)"}`,
      `7) Annual volume estimate: ${annualVolume ? formatLabelFromKey(VOLUME_OPTIONS, annualVolume) : "(not selected)"}`,
      `8) Timeline: ${timeline ? formatLabelFromKey(TIMELINE_OPTIONS, timeline) : "(not selected)"}`,
      list("9) Reference materials", refLabels),
      attachLine,
      "",
      "Notes:",
      notes?.trim() ? notes.trim() : "(none)",
      "",
      "CONTACT INFORMATION",
      `Name: ${[firstName, lastName].filter(Boolean).join(" ") || "(blank)"}`,
      `Company: ${company || "(blank)"}`,
      `Email: ${email || "(blank)"}`,
      `Phone: ${phone || "(blank)"}`,
      `State/Market: ${stateMarket || "(blank)"}`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [
    applications,
    applicationOther,
    annualVolume,
    attachments,
    company,
    compliance,
    email,
    firstName,
    flavorName,
    inclusionRate,
    lastName,
    notes,
    phone,
    profileType,
    referenceMaterials,
    sensory,
    sensoryOther,
    stateMarket,
    terpeneType,
    timeline,
  ]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitOk(false);
    setSubmitError("");

    const safeFirstName = String(firstName || "").trim();
    const safeLastName = String(lastName || "").trim();
    const safeEmail = String(email || "").trim();

    if (!safeFirstName || !safeLastName || !safeEmail) {
      setSubmitError("Please complete First Name, Last Name, and Email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: safeFirstName,
          lastName: safeLastName,
          email: safeEmail,
          message: compiledMessage,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setSubmitError(String(data?.error || "Failed to submit. Please try again."));
        return;
      }

      setSubmitOk(true);
      // Keep values filled so the user can tweak and re-submit if needed.
    } catch (err) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hintStyle = {
    marginTop: 10,
    fontSize: 13,
    opacity: 0.75,
    lineHeight: 1.45,
  };

  const chipWrapStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  };

  const chipStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? "rgba(138,180,255,0.55)" : "rgba(255,255,255,0.16)"}`,
    background: active ? "#f8fafc" : "#fff",
    cursor: "pointer",
    userSelect: "none",
  });

  const dotStyle = (active) => ({
    width: 10,
    height: 10,
    borderRadius: 999,
    border: `1px solid ${active ? "rgba(138,180,255,0.75)" : "rgba(255,255,255,0.28)"}`,
    background: active ? "#e6fff2" : "transparent",
    boxShadow: active ? "0 0 0 3px rgba(138,180,255,0.14)" : "none",
  });

  const fieldsetStyle = {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 20,
    background: "#f8fafc",
  };

  const legendStyle = {
    padding: "0 10px",
    fontSize: 15,
    opacity: 0.9,
  };

  const twoColStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
  };

  const pageStyle = {
    maxWidth: 980,
    padding: "28px 18px",
    margin: "54px auto",
  };

  const formStyle = {
    padding: 28,
    gap: 22,
  };

  const sectionStackStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 22,
  };

  return (
    <div className="el-authPage" style={pageStyle}>
      <h1 className="el-authTitle">Custom Formulation</h1>
      <p className="el-authSub">
        Tell us what you want to build — we’ll review your intake and follow up with next steps.
      </p>

      <form
        className="el-authCard"
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          borderRadius: 14,
        }}
      >
        {submitError ? <div className="el-authError">{submitError}</div> : null}
        {submitOk ? (
          <div
            className="el-authError"
            style={{
              borderColor: "#b6f5c9",
              background: "#e6f7ee",
            }}
          >
            Submitted successfully. We’ll reach out shortly.
          </div>
        ) : null}

        <div style={sectionStackStyle}>
          <label className="el-authLabel" style={{ margin: 0 }}>
            Flavor Name
            <input
              className="el-authInput"
              style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
              value={flavorName}
              onChange={(e) => setFlavorName(e.target.value)}
              placeholder="e.g., Citrus Diesel #2"
              autoComplete="off"
            />
          </label>

          {/* 1) Application */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>1) What application is this formulation intended for?</legend>
            <div style={chipWrapStyle}>
              {APPLICATION_OPTIONS.map((opt) => {
                const active = applications.includes(opt.key);
                return (
                  <div
                    key={opt.key}
                    role="checkbox"
                    aria-checked={active}
                    tabIndex={0}
                    style={chipStyle(active)}
                    onClick={() => setApplications((prev) => toggleInArray(prev, opt.key))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setApplications((prev) => toggleInArray(prev, opt.key));
                      }
                    }}
                  >
                    <span style={dotStyle(active)} />
                    <span style={{ fontSize: 14 }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>

            {applications.includes("other") ? (
              <label className="el-authLabel" style={{ margin: "16px 0 0" }}>
                Other (optional)
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={applicationOther}
                  onChange={(e) => setApplicationOther(e.target.value)}
                  placeholder="Describe the application"
                  autoComplete="off"
                />
              </label>
            ) : null}
          </fieldset>

          {/* 2) Profile type */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>2) What type of profile are you looking to develop?</legend>
            <div style={chipWrapStyle}>
              {PROFILE_OPTIONS.map((opt) => {
                const active = profileType === opt.key;
                return (
                  <div
                    key={opt.key}
                    role="radio"
                    aria-checked={active}
                    tabIndex={0}
                    style={chipStyle(active)}
                    onClick={() => setProfileType(opt.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setProfileType(opt.key);
                      }
                    }}
                  >
                    <span style={dotStyle(active)} />
                    <span style={{ fontSize: 14 }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 3) HDT / BDT / Hybrid */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>3) Do you require HDT, BDT, or a hybrid formulation?</legend>
            <div style={{ ...chipWrapStyle, display: 'flex', justifyContent: 'center' }}>
              {TERPENE_OPTIONS.map((opt) => {
                const active = terpeneType === opt.key;
                return (
                  <div
                    key={opt.key}
                    role="radio"
                    aria-checked={active}
                    tabIndex={0}
                    style={chipStyle(active)}
                    onClick={() => setTerpeneType(opt.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTerpeneType(opt.key);
                      }
                    }}
                  >
                    <span style={dotStyle(active)} />
                    <span style={{ fontSize: 14 }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 4) Sensory direction */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>4) Target sensory direction (select all that apply)</legend>
            <div style={chipWrapStyle}>
              {SENSORY_OPTIONS.map((opt) => {
                const active = sensory.includes(opt.key);
                return (
                  <div
                    key={opt.key}
                    role="checkbox"
                    aria-checked={active}
                    tabIndex={0}
                    style={chipStyle(active)}
                    onClick={() => setSensory((prev) => toggleInArray(prev, opt.key))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSensory((prev) => toggleInArray(prev, opt.key));
                      }
                    }}
                  >
                    <span style={dotStyle(active)} />
                    <span style={{ fontSize: 14 }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>

            {sensory.includes("other") ? (
              <label className="el-authLabel" style={{ margin: "16px 0 0" }}>
                Other (optional)
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={sensoryOther}
                  onChange={(e) => setSensoryOther(e.target.value)}
                  placeholder="e.g., floral, earthy, mint"
                  autoComplete="off"
                />
              </label>
            ) : null}
          </fieldset>

          {/* 5) Compliance */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>5) Do you have regulatory or compliance requirements?</legend>
            <div style={chipWrapStyle}>
              {COMPLIANCE_OPTIONS.map((opt) => {
                const active = compliance.includes(opt.key);
                return (
                  <div
                    key={opt.key}
                    role="checkbox"
                    aria-checked={active}
                    tabIndex={0}
                    style={chipStyle(active)}
                    onClick={() => setCompliance((prev) => toggleInArray(prev, opt.key))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setCompliance((prev) => toggleInArray(prev, opt.key));
                      }
                    }}
                  >
                    <span style={dotStyle(active)} />
                    <span style={{ fontSize: 14 }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 6-8 stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <label className="el-authLabel" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 500, marginBottom: 8, width: '100%' }}>
                6) Target inclusion rate (%) or use concentration
              </div>
              <input
                className="el-authInput"
                style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                value={inclusionRate}
                onChange={(e) => setInclusionRate(e.target.value)}
                placeholder="e.g., 2.5"
                inputMode="decimal"
                autoComplete="off"
              />
            </label>

            <div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '18px 16px',
                margin: '0 0 10px',
                fontSize: 16,
                letterSpacing: 0.2,
                opacity: 0.95,
                textAlign: 'center',
                fontWeight: 500
              }}>
                7) Annual volume estimate
                <div style={{ ...chipWrapStyle, display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  {VOLUME_OPTIONS.map((opt) => {
                    const active = annualVolume === opt.key;
                    return (
                      <div
                        key={opt.key}
                        role="radio"
                        aria-checked={active}
                        tabIndex={0}
                        style={chipStyle(active)}
                        onClick={() => setAnnualVolume(opt.key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setAnnualVolume(opt.key);
                          }
                        }}
                      >
                        <span style={dotStyle(active)} />
                        <span style={{ fontSize: 14 }}>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '18px 16px',
                margin: '0 0 10px',
                fontSize: 16,
                letterSpacing: 0.2,
                opacity: 0.95,
                textAlign: 'center',
                fontWeight: 500
              }}>
                8) Timeline for development
                <div style={{ ...chipWrapStyle, display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  {TIMELINE_OPTIONS.map((opt) => {
                    const active = timeline === opt.key;
                    return (
                      <div
                        key={opt.key}
                        role="radio"
                        aria-checked={active}
                        tabIndex={0}
                        style={chipStyle(active)}
                        onClick={() => setTimeline(opt.key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setTimeline(opt.key);
                          }
                        }}
                      >
                        <span style={dotStyle(active)} />
                        <span style={{ fontSize: 14 }}>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 9) Reference materials */}
          <fieldset style={fieldsetStyle}>
            <legend style={{ ...legendStyle, paddingTop: 24 }}>9) Upload reference materials (optional)</legend>
            <div style={{ ...chipWrapStyle, display: 'flex', justifyContent: 'center' }}>
            {REF_OPTIONS.map((opt) => {
              const active = referenceMaterials.includes(opt.key);
              return (
                <div
                  key={opt.key}
                  role="checkbox"
                  aria-checked={active}
                  tabIndex={0}
                  style={chipStyle(active)}
                  onClick={() => setReferenceMaterials((prev) => toggleInArray(prev, opt.key))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setReferenceMaterials((prev) => toggleInArray(prev, opt.key));
                    }
                  }}
                >
                  <span style={dotStyle(active)} />
                  <span style={{ fontSize: 14 }}>{opt.label}</span>
                </div>
              );
            })}
            </div>

            <label className="el-authLabel" style={{ margin: "18px 0 0" }}>
              Attach files (optional)
              <input
                className="el-authInput"
                style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                type="file"
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files || []))}
              />
              <div style={hintStyle}>
                Attachments are captured in your intake summary. If you need true file uploads, we can wire this to R2 later.
              </div>
            </label>

            <label className="el-authLabel" style={{ margin: "18px 0 0" }}>
              Notes / Inspiration (optional)
              <textarea
                className="el-authInput"
                style={{ background: '#f8fafc', border: '1px solid #e5e7eb', resize: 'vertical' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share inspiration, target strains, brand direction, do-not-include notes, hardware constraints, etc."
                rows={6}
              />
            </label>
          </fieldset>

          {/* 10) Contact info */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>Contact Information</legend>

            <div style={twoColStyle}>
              <label className="el-authLabel" style={{ margin: 0 }}>
                First Name
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="el-authLabel" style={{ margin: 0 }}>
                Last Name
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>

            <div style={twoColStyle}>
              <label className="el-authLabel" style={{ margin: 0 }}>
                Company
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (optional)"
                  autoComplete="organization"
                />
              </label>
              <label className="el-authLabel" style={{ margin: 0 }}>
                Email
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <div style={twoColStyle}>
              <label className="el-authLabel" style={{ margin: 0 }}>
                Phone
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(optional)"
                  autoComplete="tel"
                />
              </label>
              <label className="el-authLabel" style={{ margin: 0 }}>
                State / Market
                <input
                  className="el-authInput"
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
                  value={stateMarket}
                  onChange={(e) => setStateMarket(e.target.value)}
                  placeholder="e.g., CA, CO, MI"
                  autoComplete="address-level1"
                />
              </label>
            </div>

            <div style={hintStyle}>
              Questions? Email <a href="mailto:info@elementlab.shop">info@elementlab.shop</a> or call +1 (213) 293-8760.
            </div>
          </fieldset>

          <button className="el-authBtn" type="submit" disabled={isSubmitting} style={{ padding: "12px 14px" }}>
            {isSubmitting ? "Submitting…" : "Submit intake"}
          </button>
        </div>
      </form>
    </div>
  );
}
